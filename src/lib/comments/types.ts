export interface Reply {
  id: string;
  authorName: string;
  authorColor: string;
  createdAt: number;
  body: string;
}

export interface Thread {
  id: string;
  authorName: string;
  authorColor: string;
  createdAt: number;
  body: string;
  resolved: boolean;
  replies: Reply[];
  /** True when the root body has been deleted but replies remain. */
  rootDeleted?: true;
}
