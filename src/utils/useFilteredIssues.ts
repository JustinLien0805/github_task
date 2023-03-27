import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";

type Query = {
  text: string;
  label: string;
  sortTime: string;
};

function useFilteredIssues(query: Query) {
  console.log(query);
  const { data: session } = useSession();
  async function getAuthenticatedUsername(accessToken: string) {
    try {
      const {
        data,
      }: {
        data: {
          login: string;
        };
      } = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const username = data.login;
      return username;
    } catch (error) {
      console.error(error);
    }
  }

  async function fetchIssues({ pageParam = 1 }: { pageParam?: number }) {
    if (!session?.accessToken) {
      throw new Error("No access token");
    }

    const username = await getAuthenticatedUsername(session?.accessToken);
    const pageSize = 10;
    if (!username) {
      throw new Error("No username");
    }
    console.log(typeof query.text);
    const textQuery =
      query.text.length > 0 ? `${query.text}+in:title|body+` : "";
    let labelQuery = "";
    if (query.label === "open") {
      labelQuery = "+label:open";
    } else if (query.label === "in progress") {
      labelQuery = '+label:"in progress"';
    } else if (query.label === "done") {
      labelQuery = "+label:done";
    }

    const url = `https://api.github.com/search/issues?q=${textQuery}author:${username}+type:issue+is:open+-is:pr${labelQuery}&sort=created&order=${query.sortTime}&per_page=${pageSize}&page=${pageParam}`;
    console.log(url);
    const { data } = await axios.get(url);
    return data;
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    useInfiniteQuery(
      ["issues", query],
      ({ pageParam = 1 }) => fetchIssues({ pageParam }),
      {
        getNextPageParam: (lastPage, allPages) => {
          const maxpages = Math.ceil(lastPage.total_count / 10);
          const nextpage = allPages.length + 1;
          return nextpage <= maxpages ? nextpage : undefined;
        },
        onError(err) {
          console.error("error", err);
        },
      }
    );

  return { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading };
}

export default useFilteredIssues;
