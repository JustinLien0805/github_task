import { useRouter } from "next/router";
import { getRepoName } from "~/utils/common";
type Props = {
  item: {
    id: number;
    url: string;
    title: string;
    body: string;
    created_at: string;
    repository_url: string;
    state: string;
    labels: Array<{ color: string; name: string }>;
  };
};

const Issue = ({ item }: Props) => {
  const router = useRouter();
  const handleClick = () => {
    void router.push({
      pathname: `/issue/${item.id}`,
      query: { url: item.url },
    });
  };
  return (
    <li
      key={item.id}
      className="min-h-96 flex cursor-pointer flex-col justify-center gap-2 rounded-lg border-2 p-4"
      onClick={handleClick}
    >
      <div className="flex items-center gap-2">
        <h1 className="text-xl font-bold">{item.title}</h1>

        {item.labels?.length > 0 ? (
          <p className=" badge-info badge">{item.labels[0]?.name}</p>
        ) : (
          <p className=" badge-info badge">no label</p>
        )}
      </div>
      <p className="text-lg">From: {getRepoName(item.repository_url || "")}</p>
      <p className="text-lg">{item.body}</p>
    </li>
  );
};

export default Issue;
