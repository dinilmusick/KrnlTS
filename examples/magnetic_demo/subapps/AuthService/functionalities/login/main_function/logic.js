export const main = async (input) => {
    const { username, password } = input || {};
    if (username === "admin" && password === "secret") {
        return { success: true, token: "magnetic-token-999" };
    }
    return { success: false, reason: "Wrong password" };
};
