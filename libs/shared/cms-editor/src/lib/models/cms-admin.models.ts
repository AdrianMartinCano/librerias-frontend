import { CmsBlock } from '@org/models';

export interface CmsPageSummary {
  id:        string;
  slug:      string;
  title:     string;
  published: boolean;
  updatedAt: string;
}

export interface CmsPageDetail {
  id:          string;
  slug:        string;
  title:       string;
  description: string;
  blocks:      CmsBlock[];
  published:   boolean;
  updatedAt:   string;
}

export interface SaveCmsPageRequest {
  slug:        string;
  title:       string;
  description: string;
  blocks:      CmsBlock[];
  published:   boolean;
}
