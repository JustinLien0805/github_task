import { useInfiniteQuery } from "@tanstack/react-query";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useEffect } from "react";

type Query = {
  text: string;
  label: string;
  sortTime: string;
};

function useFilteredIssues(query: Query) {
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

  // query function
  async function fetchIssues({ pageParam = 1 }: { pageParam?: number }) {
    if (!session?.accessToken) {
      throw new Error("No access token");
    }

    const username = await getAuthenticatedUsername(session?.accessToken);
    const pageSize = 10;
    if (!username) {
      throw new Error("No username");
    }

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

    const { data } = await axios.get(url);
    return data;
  }

  // useInfiniteQuery for pagination
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useInfiniteQuery(
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

  // Scroll to bottom to fetch more issues
  useEffect(() => {
    const onScroll = (event: any) => {
      const { scrollHeight, scrollTop, clientHeight } =
        event.target.documentElement;
      if (scrollHeight - scrollTop === clientHeight) {
        fetchNextPage();
      }
    };
    document.addEventListener("scroll", onScroll);
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  return {
    data,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  };
}

export default useFilteredIssues;
