import React, { useState } from "react";
import axios from "axios";

const GitHubLogin = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userName, setUserName] = useState("");

  const clientId = "aaae79c411ebc82b24cd";
  const clientSecret = "809512135f8f652b0566f250fc028162e73e3a13";
  const redirectUri = "http://localhost:3000";

  const handleLogin = () => {
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=user`;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserName("");
  };

  const getAccessToken = async (code: string) => {
    try {
      const response = await axios.post(
        "https://github.com/login/oauth/access_token",
        {
          client_id: clientId,
          client_secret: clientSecret,
          code,
        },
        {
          headers: {
            Accept: "application/json",
          },
        }
      );

      return response.data.access_token;
    } catch (error) {
      console.error("Error getting access token:", error);
    }
  };

  const getUserInfo = async (accessToken: string) => {
    console.log(accessToken)
    try {
      const response = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      setUserName(response.data.login);
      setIsLoggedIn(true);
    } catch (error) {
      console.error("Error getting user info:", error);
    }
  };

  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get("code");

    if (code) {
      (async () => {
        const accessToken = await getAccessToken(code);
        getUserInfo(accessToken);
      })();
    }
  }, []);

  return (
    <div>
      {isLoggedIn ? (
        <>
          <p>Welcome, {userName}!</p>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <button onClick={handleLogin}>Login with GitHub</button>
      )}
    </div>
  );
};

export default GitHubLogin;
