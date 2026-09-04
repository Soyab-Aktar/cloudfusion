export interface ICreateFolder {
  userId: string;
  name: string;
  parentId?: string;
  connectedAccountId?: string;
}

export interface IRenameFolder {
  userId: string,
  folderId: string,
  newName: string,
}