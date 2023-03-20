import { type NextPage } from "next";
import Head from "next/head";

import { signIn, signOut, useSession } from "next-auth/react";

import { useRouter } from "next/router";
import { useEffect } from "react";
const Home: NextPage = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const handleSignIn = async () => {
    await signIn();
  };

  useEffect(() => {
    console.log(status);
    if (session?.user) {
      void router.push("/home");
    }
  }, [session]);
  return (
    <>
      <Head>
        <title>Create T3 App</title>
        <meta name="description" content="Generated by create-t3-app" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div className="flex h-screen w-full flex-col items-center justify-center">
        {session?.user ? (
          <button className="btn" onClick={() => signOut()}>
            sign out
          </button>
        ) : (
          <button className="btn" onClick={handleSignIn}>
            sign in
          </button>
        )}
      </div>
    </>
  );
};

export default Home;
