import { normalizeImageSource } from './imageSource';

interface ProjectLogoFields {
  customLogo?: string;
  repoAvatarUrl?: string;
}

export interface ProjectLogo {
  src: string;
  source: 'custom' | 'repository';
}

export function resolveProjectLogo(project: ProjectLogoFields): ProjectLogo | undefined {
  const customLogo = normalizeImageSource(project.customLogo);
  if (customLogo) {
    return { src: customLogo, source: 'custom' };
  }

  const repoAvatarUrl = normalizeImageSource(project.repoAvatarUrl);
  return repoAvatarUrl ? { src: repoAvatarUrl, source: 'repository' } : undefined;
}
