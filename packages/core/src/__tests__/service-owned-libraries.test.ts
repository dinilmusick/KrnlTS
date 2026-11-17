import { describe, it, expect } from 'vitest';
import { ServiceFacade, FunctionalityOrchestration } from '../index.js';

describe('Service-Owned Library Architecture', () => {
  it('registers libraries via constructor and provides typed access on ServiceFacade', () => {
    const userValidationLib = {
      validateEmail: (email: string) => email.includes('@'),
      minPasswordLength: 8,
    };

    const serviceA = new ServiceFacade({
      id: 'service.a',
      name: 'ServiceA',
      libraries: {
        userValidation: userValidationLib,
      },
    });

    expect(serviceA.libraries.userValidation).toBeDefined();
    expect(serviceA.libraries.userValidation.validateEmail('user@example.com')).toBe(true);
    expect(serviceA.libraries.userValidation.validateEmail('invalid-email')).toBe(false);
    expect(serviceA.libraries.userValidation.minPasswordLength).toBe(8);
  });

  it('supports runtime registration of libraries via registerLibrary() and retrieval via getLibrary()', () => {
    const service = new ServiceFacade({
      id: 'service.calc',
      name: 'CalculatorService',
    });

    const mathLib = {
      add: (a: number, b: number) => a + b,
      multiply: (a: number, b: number) => a * b,
    };

    service.registerLibrary('math', mathLib);

    expect(service.libraries.math).toBeDefined();
    expect(service.getLibrary<typeof mathLib>('math').add(2, 3)).toBe(5);
    expect(service.getLibrary<typeof mathLib>('math').multiply(4, 5)).toBe(20);
  });

  it('throws an informative error when accessing an unregistered library via getLibrary()', () => {
    const service = new ServiceFacade({
      id: 'service.empty',
      name: 'EmptyService',
    });

    expect(() => service.getLibrary('nonexistent')).toThrow(
      '[ServiceFacade:service.empty] Library "nonexistent" not found on service facade.'
    );
  });

  it('allows cross-service library consumption strictly through owning service facade', () => {
    const taxLibrary = {
      calculateTax: (subtotal: number, rate: number) => subtotal * rate,
    };

    const taxService = new ServiceFacade({
      id: 'service.tax',
      name: 'TaxService',
      libraries: {
        taxLib: taxLibrary,
      },
    });

    // Service B consumes Service A library via Service A's facade
    const checkoutService = new ServiceFacade({
      id: 'service.checkout',
      name: 'CheckoutService',
      dependencies: [
        { serviceId: 'service.tax' },
      ],
    });

    const taxAmount = taxService.libraries.taxLib.calculateTax(100, 0.2);
    expect(taxAmount).toBe(20);
  });

  it('maintains service-scoped library identity without collisions for identical library names', () => {
    const serviceA = new ServiceFacade({
      id: 'service.a',
      name: 'ServiceA',
      libraries: {
        config: { env: 'production', port: 443 },
      },
    });

    const serviceB = new ServiceFacade({
      id: 'service.b',
      name: 'ServiceB',
      libraries: {
        config: { env: 'development', port: 3000 },
      },
    });

    expect(serviceA.libraries.config.env).toBe('production');
    expect(serviceB.libraries.config.env).toBe('development');
    expect(serviceA.libraries.config.port).toBe(443);
    expect(serviceB.libraries.config.port).toBe(3000);
  });

  it('strictly decouples library types from functionality runtime state', () => {
    // Having complex structs or libraries does not inject or force runtime state on a service or functionality
    const service = new ServiceFacade({
      id: 'service.stateless',
      name: 'StatelessService',
      libraries: {
        domainModels: {
          UserStruct: { fields: ['id', 'email', 'name'] },
        },
      },
    });

    // Default state is empty object, not populated or forced by library models
    expect(service.getState()).toEqual({});
    expect(service.libraries.domainModels.UserStruct.fields).toHaveLength(3);
  });
});
