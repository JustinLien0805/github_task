import { type NextPage } from "next";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import { useInView } from "react-intersection-observer";
type Issue = {
  items: Array<{ id: number; title: string; body: string }>;
};
const Home: NextPage = () => {
  const [issuesList, setIssuesList] = useState<Array<Issue>>([]);
  const [query, setQuery] = useState<String>("");
  const { data: session, status } = useSession();
  const { ref, inView } = useInView();

  const router = useRouter();
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/");
    }
  }, [status]);

  async function getAuthenticatedUsername(accessToken: string) {
    try {
      const { data } = await axios.get("https://api.github.com/user", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });
      const username: string = data.login;
      console.log(username);
      return username;
    } catch (error) {
      console.error(error);
    }
  }

  // fetch issues by username
  async function fetchIssues(pageNumber = 0) {
    if (session?.accessToken) {
      const username = await getAuthenticatedUsername(session?.accessToken);
      const pageSize = 10;
      if (username) {
        const url = `https://api.github.com/search/issues?q=author:${username}&sort=created&order=asc&per_page=${pageSize}&page=${pageNumber}`;
        const { data } = await axios.get(url);
        return data;
      }
    } else {
      return [];
    }
  }

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useInfiniteQuery(
      ["issues"],
      ({ pageParam = 1 }) => fetchIssues(pageParam),
      {
        getNextPageParam: (lastPage, allPages) => {
          const maxpages = lastPage.total_count / 10;
          const nextpage = allPages.length + 1;
          return nextpage <= maxpages ? nextpage : undefined;
        },
      }
    );

  useEffect(() => {
    console.log(data);
    if (data) {
      const newIssuesList: Array<Issue> = data.pages;
      setIssuesList(newIssuesList);
    }
  }, [data]);

  useEffect(() => {
    console.log(hasNextPage);
    const onScroll = (event: any) => {
      const { scrollHeight, scrollTop, clientHeight } =
        event.target.documentElement;
      if (scrollHeight - scrollTop === clientHeight) {
        console.log("bottom");
        fetchNextPage();
      }
    };
    document.addEventListener("scroll", onScroll);
    return () => document.removeEventListener("scroll", onScroll);
  }, []);

  console.log("issuesList:", issuesList);

  const filteredIssues = useMemo(() => {
    return issuesList
      .flatMap((issue) => issue.items)
      .filter((item) => {
        const matchBody = item?.body
          ?.toLowerCase()
          .includes(query.toLowerCase());
        return matchBody;
      });
  }, [query, issuesList]);
  const handleSearch = () => {
    setQuery("");
  };

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(event.target.value);
  };

  return (
    <>
      <div className="flex w-full flex-col justify-center">
        <button className="btn" onClick={() => signOut()}>
          sign out
        </button>
        <input
          type="text"
          value={query as string}
          onChange={handleQueryChange}
        />
        <button onClick={handleSearch}>Clear</button>
        <ul>
          {query
            ? filteredIssues.map((item) => (
                <li key={item.id} className="h-screen">
                  <h1 className="font-bold">{item.title}</h1>
                  <p>{item.body}</p>
                </li>
              ))
            : issuesList.map((issue, i) =>
                issue.items?.map((issue) => (
                  <li key={issue.id} className="h-screen">
                    <h1 className="font-bold">{issue.title}</h1>
                    <p>{issue.body}</p>
                  </li>
                ))
              )}
          {isFetchingNextPage && <li>Loading more...</li>}
          {!hasNextPage && <li>End of issues</li>}
        </ul>
      </div>
    </>
  );
};

export default Home;
