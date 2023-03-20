import React from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useSession, getSession } from "next-auth/react";
import { type GetServerSideProps } from "next";
import { type Session } from "next-auth";

interface Issue {
  id: number;
  url: string;
  title: string;
  body: string;
  created_at: string;
  state: string;
  labels: Array<{ color: string; name: string }>;
  repository_url: string;
  user: {
    login: string;
    avatar_url: string;
  };
}
interface ComponentProps {
  session: Session | null;
  issueData: Issue;
}

const IssueFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  body: z.string().min(30, "Body must be at least 30 words"),
  label: z.string().min(1, "Label is required"),
});

const Issue = (issueData: Issue) => {
  const router = useRouter();
  const { data: session } = useSession();
  const { url } = router.query;
  const queryClient = useQueryClient();

  // query for issue details
  const { data } = useQuery(
    ["issue"],
    async () => {
      if (typeof url !== "string") {
        throw new Error("Invalid URL type");
      }
      const { data } = await axios.get<Issue>(url);
      return data;
    },
    {
      initialData: issueData,
    }
  );

  // Set up form for editing title and body
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(IssueFormSchema),
  });

  // mutation for edit title and body
  async function updateIssue({
    url,
    title,
    body,
    label,
  }: {
    url: string | string[] | undefined;
    title: string;
    body: string;
    label: string;
  }) {
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.accessToken}`,
      },
    };
    const titleBodyData = {
      title,
      body,
    };

    if (typeof url !== "string") {
      throw new Error("Invalid URL type");
    }
    console.log(url);
    try {
      const labelResponse = await axios.put(
        `${url}/labels`,
        { labels: [label] },
        config
      );

      if (labelResponse.status !== 200) {
        throw new Error("Label not updated");
      }
      const titleBodyResponse = await axios.patch(url, titleBodyData, config);
      return titleBodyResponse.data;
    } catch (error) {
      console.log(error);
    }
  }

  const updateIssueMutation = useMutation(updateIssue, {
    onSuccess: () => {
      alert("Issue updated successfully");
      queryClient.invalidateQueries(["issue"]);
    },
    onError: (error) => {
      alert(error);
    },
  });

  // close issue
  async function closeIssue(url: string | string[] | undefined) {
    const config = {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session?.accessToken}`,
      },
    };

    const data = {
      state: "closed",
    };
    if (typeof url !== "string") {
      throw new Error("Invalid URL type");
    }
    try {
      const response = await axios.patch(url, data, config);
      return response.data;
    } catch (error) {
      console.log(error);
    }
  }

  const closeIssueMutation = useMutation(closeIssue, {
    onSuccess: () => {
      alert("Issue closed successfully");
      router.push("/home");
      queryClient.invalidateQueries(["issue", "issues"]);
    },
    onError: (error) => {
      alert(error);
    },
  });

  function getRepoName(repoUrl: string) {
    repoUrl.lastIndexOf("/");
    const repoName = repoUrl.slice(repoUrl.lastIndexOf("/") + 1);
    return repoName;
  }
  function getRepoUrl(repoUrl: string) {
    const newrepoUrl =
      repoUrl?.slice(0, 8) + repoUrl?.slice(12, 22) + repoUrl?.slice(28);
    return newrepoUrl;
  }
  return (
    <>
      <div className="flex h-screen w-screen flex-col items-center gap-8 px-2 pt-8 sm:py-20 sm:px-8">
        <nav className="flex w-full max-w-2xl items-center sm:w-3/5">
          <h1
            className="mr-auto cursor-pointer text-2xl font-bold sm:text-3xl"
            onClick={() => {
              router.push("/home");
            }}
          >
            Github Task Manager
          </h1>
          <button
            className="btn"
            onClick={() => {
              router.push("/home");
            }}
          >
            back
          </button>
        </nav>
        <div className="flex w-full max-w-2xl flex-col gap-4 sm:w-3/5">
          <div className="flex items-center gap-2">
            <div className="avatar">
              <div className="h-8 w-8 rounded-full">
                <img src={data?.user?.avatar_url} />
              </div>
            </div>
            <p>{data?.user?.login}</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-2xl font-bold sm:text-3xl">
              Issue: {data?.title}
            </p>
            <div className=" badge-info badge mr-auto">
              {data?.labels?.length > 0 ? data?.labels[0]?.name : "no label"}
            </div>
            <p>Created at: {data?.created_at}</p>
          </div>
          <p className="text-lg">
            From:{" "}
            <a
              href={getRepoUrl(data?.repository_url)}
              className="link-info link"
              target="_blank"
              rel="noreferrer"
            >
              {getRepoName(data?.repository_url || "")}
            </a>
          </p>
          <p className="rounded-lg border-2 p-4 text-lg">
            {data?.body}
          </p>

          <div className="flex gap-2">
            <label htmlFor="my-modal" className="btn-warning btn flex-1">
              Edit
            </label>
            <button
              className="btn-error btn flex-1"
              onClick={async () => {
                await closeIssueMutation.mutateAsync(url);
              }}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
      {/* modal for edit title and body */}
      <input type="checkbox" id="my-modal" className="modal-toggle" />
      <div className="modal">
        <div className="reletive modal-box">
          <label
            htmlFor="my-modal"
            className="btn-sm btn-circle btn absolute right-2 top-2"
          >
            ✕
          </label>
          <h3 className="text-lg font-bold">Edit Issue</h3>
          <form
            className="flex flex-col gap-4"
            onSubmit={handleSubmit(async (formData) => {
              console.log(formData.title, formData.body, formData.label);
              try {
                const updatedIssue = await updateIssueMutation.mutateAsync({
                  url: url,
                  title: formData.title,
                  body: formData.body,
                  label: formData.label,
                });
                console.log("Issue updated:", updatedIssue);
              } catch (error) {
                console.error("Error updating issue:", error);
              }
            })}
          >
            <div className="form-control">
              <label className="label">
                <span className="label-text">Title</span>
                <span className="label-text-alt">required</span>
              </label>
              <input
                {...register("title")}
                type="text"
                defaultValue={data?.title}
                className={`input-bordered input w-full ${
                  errors.title ? "border-red-500" : ""
                }`}
              />
              {errors.title && (
                <p className="text-red-500">
                  {errors.title.message as React.ReactNode}
                </p>
              )}
            </div>
            <div className="form-control">
              <label className="label">
                <span className="label-text">Body</span>
                <span className="label-text-alt">at least 30 words</span>
              </label>
              <textarea
                defaultValue={data?.body}
                {...register("body")}
                className={`textarea-bordered textarea h-24 ${
                  errors.body ? "border-red-500" : ""
                }`}
              ></textarea>
              {errors.body && (
                <p className="text-red-500">
                  {errors.body.message as React.ReactNode}
                </p>
              )}
            </div>
            <div>
              <label className="label">
                <span className="label-text">Label</span>
              </label>
              <select
                className="select-bordered select w-full max-w-xs"
                {...register("label")}
              >
                <option value="" disabled>
                  Select a label
                </option>
                <option value={"done"}>done</option>
                <option value={"in progress"}>in progress</option>
                <option value={"open"}>open</option>
              </select>
              {errors.label && (
                <p className="text-red-500">
                  {errors.label.message as React.ReactNode}
                </p>
              )}
            </div>
            <div className="modal-action">
              <button type="submit" className="btn">
                Save
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default Issue;

async function fetchIssueByUrl(url: string): Promise<Issue> {
  const { data } = await axios.get<Issue>(url);
  return data;
}

export const getServerSideProps: GetServerSideProps<ComponentProps> = async (
  context
) => {
  const session = await getSession(context);
  const url = context.query.url;

  if (typeof url !== "string") {
    return {
      notFound: true,
    };
  }

  const data = await fetchIssueByUrl(url);

  return {
    props: {
      session,
      issueData: data,
    },
  };
};