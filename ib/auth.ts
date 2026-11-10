import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

function getJwtSecret(): string {
  if (!JWT_SECRET) {
    throw new Error("JWT_SECRET is not defined");
  }

  return JWT_SECRET;
}

export function createToken(userId: string) {
  return jwt.sign(
    { userId },
    getJwtSecret(),
    {
      expiresIn: "7d",
    }
  );
}

export function verifyToken(token: string) {
  try {
    const decoded = jwt.verify(token, getJwtSecret());

    if (typeof decoded === "string") {
      return null;
    }

    const payload = decoded as JwtPayload & {
      userId?: unknown;
    };

    if (typeof payload.userId !== "string") {
      return null;
    }

    return {
      userId: payload.userId,
    };
  } catch {
    return null;
  }
}