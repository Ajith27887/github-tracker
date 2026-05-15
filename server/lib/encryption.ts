// import crypto from "node:crypto";

// const ALGORITHM = "aes-256-gcm";
// const IV_LENGTH = 12;

// function getKey(): Buffer {
// 	const raw = process.env.TOKEN_ENCRYPTION_KEY;
// 	if (!raw) {
// 		throw new Error("TOKEN_ENCRYPTION_KEY is not set");
// 	}
// 	if (/^[0-9a-fA-F]{64}$/.test(raw)) {
// 		return Buffer.from(raw, "hex");
// 	}
// 	return crypto.createHash("sha256").update(raw).digest();
// }

// export function encrypt(plaintext: string): string {
// 	const iv = crypto.randomBytes(IV_LENGTH);
// 	const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
// 	const ciphertext = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
// 	const authTag = cipher.getAuthTag();
// 	return `${iv.toString("hex")}:${authTag.toString("hex")}:${ciphertext.toString("hex")}`;
// }

// export function decrypt(payload: string): string {
// 	const [ivHex, authTagHex, ciphertextHex] = payload.split(":");
// 	if (!ivHex || !authTagHex || !ciphertextHex) {
// 		throw new Error("Invalid encrypted payload format");
// 	}
// 	const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, "hex"));
// 	decipher.setAuthTag(Buffer.from(authTagHex, "hex"));
// 	const plaintext = Buffer.concat([
// 		decipher.update(Buffer.from(ciphertextHex, "hex")),
// 		decipher.final()
// 	]);
// 	return plaintext.toString("utf8");
// }


