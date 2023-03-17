import React from "react";

type Props = {
  item: {
    id: number;
    title: string;
    body: string;
    created_at: string;
    labels: Array<{ color: string; name: string }>;
  };
};

const Issue = ({ item }: Props) => {
  return (
    <li
      key={item.id}
      className="min-h-96 flex cursor-pointer flex-col justify-center rounded-lg border-2 border-black p-4"
    >
      <h1 className="text-xl font-bold">{item.title}</h1>
      <p>{item.body}</p>
      <p>{item.created_at}</p>
      {item.labels?.length > 0 && <p>label: {item.labels[0]?.name}</p>}
    </li>
  );
};

export default Issue;
