import { type NextPage } from "next";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useSession } from "next-auth/react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { signOut } from "next-auth/react";
import { useRouter } from "next/router";
import Issue from "~/components/Issue";

type Issue = {
  items: Array<{
    id: number;
    url: string;
    title: string;
    body: string;
    created_at: string;
    state: string;
    labels: Array<{ color: string; name: string }>;
  }>;
};

type Query = {
  text: string;
  label: string;
  sortTime: string;
};
const Home: NextPage = () => {
  const [issuesList, setIssuesList] = useState<Array<Issue>>([]);
  const [query, setQuery] = useState<Query>({
    text: "",
    label: "",
    sortTime: "",
  });
  const { data: session, status } = useSession();

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
      return username;
    } catch (error) {
      console.error(error);
    }
  }

  // fetch issues by username
  // after getting the username fetch issues with labels and exclude pull requests and sort by created date in descending order wtih pagination
  async function fetchIssues(pageNumber = 0) {
    if (session?.accessToken) {
      const username = await getAuthenticatedUsername(session?.accessToken);
      const pageSize = 10;
      if (username) {
        const url = `https://api.github.com/search/issues?q=author:${username}+type:issue+is:open+-is:pr&sort=created&order=desc&per_page=${pageSize}&page=${pageNumber}`;
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
    if (data) {
      const newIssuesList: Array<Issue> = data.pages;
      setIssuesList(newIssuesList);
    }
  }, [data]);

  useEffect(() => {
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

  const filteredIssues = useMemo(() => {
    const textFilter = issuesList
      .flatMap((issue) => issue.items)
      .filter((item) => {
        const matchTitle = item?.title
          ?.toLowerCase()
          .includes(query.text.toLowerCase());
        const matchBody = item?.body
          ?.toLowerCase()
          .includes(query.text.toLowerCase());
        return matchTitle || matchBody;
      });

    const labelFilter = textFilter.filter((item) => {
      if (query.label === "") {
        return true; // No label query specified, so include all issues
      } else {
        return item.labels.some(
          (label) => label.name.toLowerCase() === query.label.toLowerCase()
        );
      }
    });
    let timeFilter = labelFilter;
    if (query.sortTime === "ASC") {
      timeFilter = timeFilter.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
    } else if (query.sortTime === "DESC") {
      timeFilter = timeFilter.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    }
    return timeFilter;
  }, [query, issuesList]);

  const handleQueryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setQuery({ ...query, text: event.target.value });
  };

  return (
    <>
      <div className="flex w-full flex-col justify-center gap-8 py-20 px-8">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold">Github Task Manager</h1>
          <button className="btn ml-auto" onClick={() => signOut()}>
            sign out
          </button>
        </div>
        <input
          type="text"
          className="input-bordered input"
          value={query.text}
          placeholder="Search issues by title or body"
          onChange={handleQueryChange}
        />
        <div className="flex">
          <div className="dropdown">
            <label tabIndex={0} className="btn m-1">
              {query.label || "Sorted by Label"}
            </label>
            <ul
              tabIndex={0}
              className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow"
            >
              <li>
                <a onClick={() => setQuery({ ...query, label: "done" })}>
                  done
                </a>
              </li>
              <li>
                <a onClick={() => setQuery({ ...query, label: "in progress" })}>
                  in progress
                </a>
              </li>
              <li>
                <a onClick={() => setQuery({ ...query, label: "open" })}>
                  open
                </a>
              </li>
            </ul>
          </div>
          <div className="dropdown">
            <label tabIndex={1} className="btn m-1">
              {query.sortTime || "Sorted by time"}
            </label>
            <ul
              tabIndex={1}
              className="dropdown-content menu rounded-box w-52 bg-base-100 p-2 shadow"
            >
              <li>
                <a onClick={() => setQuery({ ...query, sortTime: "ASC" })}>
                  ASC
                </a>
              </li>
              <li>
                <a onClick={() => setQuery({ ...query, sortTime: "DESC" })}>
                  DESC
                </a>
              </li>
            </ul>
          </div>
          <button
            className="btn m-1"
            onClick={() =>
              setQuery({
                text: "",
                label: "",
                sortTime: "",
              })
            }
          >
            clear filter
          </button>
        </div>
        <ul className="flex flex-col gap-4">
          {query
            ? filteredIssues.map((item) => <Issue key={item.id} item={item} />)
            : issuesList.map((issue, i) =>
                issue.items?.map((item) => <Issue key={item.id} item={item} />)
              )}
          {isFetchingNextPage && <li>Loading more...</li>}
          {!hasNextPage && <li className="text-center">End of issues</li>}
        </ul>
      </div>
    </>
  );
};

export default Home;
