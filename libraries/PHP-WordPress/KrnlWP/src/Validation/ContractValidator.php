<?php

declare(strict_types=1);

namespace KrnlWP\Validation;

use Symfony\Component\Validator\Validation;
use Symfony\Component\Validator\ConstraintViolationListInterface;

final class ContractValidator {
    public function validate(object $value): ConstraintViolationListInterface {
        return Validation::createValidatorBuilder()->enableAttributeMapping()->getValidator()->validate($value);
    }
}