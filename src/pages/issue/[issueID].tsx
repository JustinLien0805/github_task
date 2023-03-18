import React from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation } from "@tanstack/react-query";
import axios from "axios";
const Issue = () => {
  const router = useRouter();
  const { url } = router.query;

  async function fetchIssueByUrl() {
    if (typeof url !== "string") {
      throw new Error("Invalid URL type");
    }
    const { data } = await axios.get(url);
    console.log(data);
    return data;
  }

  const { data, isLoading } = useQuery(["issue"], fetchIssueByUrl);

  //   if (isLoading) {
  //     return <div>Loading...</div>;
  //   }

  return (
    <div>
      <h1>Issue: {url}</h1>
    </div>
  );
};

export default Issue;
