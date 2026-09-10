import type { NextAuthOptions } from "next-auth";
import GitHubProvider from "next-auth/providers/github";
import GoogleProvider from "next-auth/providers/google";
import FacebookProvider from "next-auth/providers/facebook";
import CredentialsProvider from "next-auth/providers/credentials";
import type { OAuthConfig } from "next-auth/providers/oauth";

const FIREBASE_API_KEY =
  process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCc2EE3QS27fF9Jhd-h-yqAeMhGsZgWmwk";

async function firebaseAuth(
  mode: "signInWithPassword" | "signUp",
  email: string,
  password: string
) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:${mode}?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    }
  );
  const data = await res.json();
  if (!res.ok) {
    const msg = data?.error?.message || "Firebase auth failed";
    throw new Error(msg);
  }
  return data as {
    idToken: string;
    refreshToken: string;
    expiresIn: string;
    localId: string;
    email: string;
    displayName?: string;
  };
}

/** OpenAI / Sign in with ChatGPT (requires registered OAuth client) */
function OpenAIProvider(options: {
  clientId: string;
  clientSecret: string;
}): OAuthConfig<any> {
  return {
    id: "openai",
    name: "ChatGPT",
    type: "oauth",
    clientId: options.clientId,
    clientSecret: options.clientSecret,
    authorization: {
      url: "https://auth.openai.com/authorize",
      params: {
        scope: "openid profile email offline_access",
        response_type: "code",
      },
    },
    token: "https://auth0.openai.com/oauth/token",
    userinfo: "https://auth0.openai.com/userinfo",
    checks: ["pkce", "state"],
    profile(profile: any) {
      return {
        id: profile.sub,
        name: profile.name || profile.nickname || profile.email,
        email: profile.email,
        image: profile.picture,
      };
    },
  };
}

const providers: NextAuthOptions["providers"] = [
  GitHubProvider({
    clientId: process.env.GITHUB_ID as string,
    clientSecret: process.env.GITHUB_SECRET as string,
  }),
  GoogleProvider({
    clientId: process.env.GOOGLE_CLIENT_ID as string,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    authorization: {
      params: {
        prompt: "consent",
        access_type: "offline",
        response_type: "code",
      },
    },
  }),
  FacebookProvider({
    clientId: process.env.FACEBOOK_CLIENT_ID as string,
    clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
  }),
  CredentialsProvider({
    id: "firebase",
    name: "Email",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      mode: { label: "Mode", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) {
        throw new Error("Email and password required");
      }
      const mode =
        credentials.mode === "signup" ? "signUp" : "signInWithPassword";
      try {
        const data = await firebaseAuth(mode, credentials.email, credentials.password);
        return {
          id: data.localId,
          email: data.email,
          name: data.displayName || data.email.split("@")[0],
          accessToken: data.idToken,
          refreshToken: data.refreshToken,
          expiresIn: data.expiresIn,
        } as any;
      } catch (e: any) {
        throw new Error(e?.message || "Auth failed");
      }
    },
  }),
];

if (process.env.OPENAI_CLIENT_ID && process.env.OPENAI_CLIENT_SECRET) {
  providers.push(
    OpenAIProvider({
      clientId: process.env.OPENAI_CLIENT_ID,
      clientSecret: process.env.OPENAI_CLIENT_SECRET,
    })
  );
}

export const authOptions: NextAuthOptions = {
  providers,
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  callbacks: {
    async jwt({ token, account, user }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.provider = account.provider;
        token.providerAccountId = account.providerAccountId;
        token.expiresAt = account.expires_at;
        token.idToken = account.id_token;
      }
      if (user && (user as any).accessToken) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.provider = "firebase";
        token.providerAccountId = user.id;
        const expiresIn = parseInt((user as any).expiresIn || "3600", 10);
        token.expiresAt = Math.floor(Date.now() / 1000) + expiresIn;
        token.idToken = (user as any).accessToken;
      }
      if (user) {
        token.name = user.name;
        token.email = user.email;
        token.picture = user.image;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.refreshToken = token.refreshToken as string | undefined;
      session.provider = token.provider as string | undefined;
      session.providerAccountId = token.providerAccountId as string | undefined;
      session.expiresAt = token.expiresAt as number | undefined;
      session.idToken = token.idToken as string | undefined;
      if (session.user) {
        session.user.name = token.name as string | undefined;
        session.user.email = token.email as string | undefined;
        session.user.image = token.picture as string | undefined;
      }
      return session;
    },
  },
};
