import {
  Image,
  Link,
  Path,
  Svg,
  Text,
  View,
} from '@/components/core/Universal';
import { DescriptionLines } from '@/components/resume/DescriptionLines';
import { InlineMetadataItem } from '@/components/resume/InlineMetadataItem';
import { pxToPt } from '@/components/resume/layoutMetrics';
import { ProjectTechnologyPill } from '@/components/resume/ProjectTechnologyPill';
import { SectionHeading } from '@/components/resume/SectionHeading';
import type { ResumeSectionSharedProps } from '@/components/resume/layoutTypes';
import {
  projectAnchor,
  projectProofAnchor,
  sectionAnchor,
} from '@/lib/previewAnchor';
import { resolveSkillLogo } from '@/lib/skillLogo';
import {
  formatCompactNumber,
  formatGitHubPath,
  formatProofRefLabel,
  getDateRange,
  isSafePdfUrl,
  sanitizeUrl,
} from '@/lib/resumeUtils';
import type { Project, SectionConfig } from '@/types';

const INLINE_ICON_GAP = pxToPt(2);
const INLINE_ICON_LINK_GAP = pxToPt(3);
const INLINE_METADATA_GAP = pxToPt(6);

interface ProjectSectionProps {
  section: SectionConfig;
  items: Project[];
  shared: ResumeSectionSharedProps;
}

function buildDuplicateSafeKeys(values: string[], prefix: string) {
  const counts = new Map<string, number>();

  return values.map((value) => {
    const occurrence = counts.get(value) ?? 0;
    counts.set(value, occurrence + 1);
    return `${prefix}-${value}-${occurrence}`;
  });
}

function renderTechnologyPills(
  projectId: string,
  technologies: string[],
  visibleCount: number,
  theme: ResumeSectionSharedProps['theme'],
  metrics: ResumeSectionSharedProps['metrics']
) {
  const visibleTechnologies = technologies.slice(0, visibleCount);
  const technologyKeys = buildDuplicateSafeKeys(visibleTechnologies, projectId);

  return visibleTechnologies.map((tech, technologyIndex) => (
    <ProjectTechnologyPill
      key={technologyKeys[technologyIndex]}
      label={tech}
      icon={resolveSkillLogo(tech)}
      theme={theme}
      metrics={metrics}
    />
  ));
}

function ProjectLinks({
  project,
  shared,
}: {
  project: Project;
  shared: ResumeSectionSharedProps;
}) {
  const { theme, linksEnabled, metrics } = shared;
  const repoHref = sanitizeUrl(project.repoUrl);
  const projectHref = sanitizeUrl(project.url);

  return (
    <>
      {project.repoUrl ? (
        <InlineMetadataItem
          value={formatGitHubPath(project.repoUrl)}
          href={repoHref}
          enableLinks={linksEnabled}
          color="#9ca3af"
          fontSize={theme.fontSize - 2}
          lineHeight={metrics.metadataLineHeight}
          iconBoxSize={metrics.inlineIconBoxSize}
          iconGap={INLINE_ICON_GAP}
          style={{ marginLeft: INLINE_METADATA_GAP }}
          icon={
            <Svg viewBox="0 0 24 24" style={{ width: metrics.inlineIconSize, height: metrics.inlineIconSize }}>
              <Path
                d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
                fill="#9ca3af"
              />
            </Svg>
          }
        />
      ) : null}

      {project.showStars !== false && typeof project.repoStars === 'number' && project.repoStars > 0 ? (
        <InlineMetadataItem
          value={formatCompactNumber(project.repoStars)}
          enableLinks={false}
          color="#d97706"
          fontSize={theme.fontSize - 2}
          lineHeight={metrics.metadataLineHeight}
          iconBoxSize={metrics.inlineIconBoxSize}
          iconGap={INLINE_ICON_GAP}
          style={{ marginLeft: INLINE_METADATA_GAP }}
          icon={
            <Svg viewBox="0 0 24 24" style={{ width: metrics.inlineIconSize, height: metrics.inlineIconSize }}>
              <Path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill="#d97706" />
            </Svg>
          }
        />
      ) : null}

      {project.url ? (
        <InlineMetadataItem
          value={project.url}
          href={projectHref}
          enableLinks={linksEnabled}
          color="#9ca3af"
          fontSize={theme.fontSize - 2}
          lineHeight={metrics.metadataLineHeight}
          iconBoxSize={metrics.inlineIconBoxSize}
          iconGap={INLINE_ICON_LINK_GAP}
          style={{ marginLeft: INLINE_METADATA_GAP }}
          icon={
            <Svg viewBox="0 0 24 24" style={{ width: metrics.inlineIconSize, height: metrics.inlineIconSize }}>
              <Path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" fill="#9ca3af" />
            </Svg>
          }
        />
      ) : null}
    </>
  );
}

export function ProjectSection({ section, items, shared }: ProjectSectionProps) {
  const { theme, linksEnabled, translations, metrics, SelectableBlock, renderMarkdown } = shared;
  const visibleProjects = items.filter((item) => item.visible !== false);

  if (visibleProjects.length === 0) {
    return null;
  }

  return (
    <View style={{ marginBottom: Math.max(theme.spacing * 2, 0) }}>
      <SectionHeading
        anchor={sectionAnchor(section.id)}
        title={section.title || translations.projects}
        shared={shared}
      />
      {visibleProjects.map((project) => {
        const isCompact = project.layout === 'compact';
        const hasProjectDescription = project.description.some((line) => line.trim().length > 0);
        const projectProofs = project.proofs || [];
        const projectLogoSize = isCompact
          ? pxToPt(metrics.isDenseLayout ? 20 : 24)
          : pxToPt(metrics.isDenseLayout ? 28 : 36);
        const listTopMargin = metrics.isDenseLayout ? (isCompact ? 1 : 2) : (isCompact ? 1.5 : 3.5);
        const descriptionGap = metrics.isDenseLayout ? (isCompact ? 1 : 1.5) : (isCompact ? 1.5 : 2.5);
        const hasProjectLogo =
          project.showLogo !== false && Boolean(project.customLogo?.length || project.repoAvatarUrl?.length);
        const proofIndent = hasProjectLogo ? projectLogoSize + pxToPt(metrics.isDenseLayout ? 6 : 9) : 0;

        return (
          <SelectableBlock key={project.id} anchor={projectAnchor(project.id)}>
            <View style={{ marginBottom: metrics.itemMarginBottom }}>
              <View>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  {hasProjectLogo ? (
                    <Image
                      src={project.customLogo || project.repoAvatarUrl || ''}
                      alt=""
                      style={{
                        width: projectLogoSize,
                        height: projectLogoSize,
                        borderRadius: projectLogoSize / 2,
                        marginRight: pxToPt(metrics.isDenseLayout ? 6 : 9),
                        objectFit: 'cover',
                      }}
                    />
                  ) : null}
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', flex: 1, minWidth: 0, paddingRight: pxToPt(metrics.isDenseLayout ? 6 : 8) }}>
                        <Text inline style={{ fontSize: theme.fontSize, fontWeight: 'bold', lineHeight: metrics.headingLineHeight }}>
                          {project.name}
                        </Text>
                        {project.role ? (
                          <Text inline style={{ fontSize: theme.fontSize - 1, color: '#6b7280', marginLeft: pxToPt(metrics.isDenseLayout ? 4 : 6) }}>
                            {project.role}
                          </Text>
                        ) : null}
                        <ProjectLinks project={project} shared={shared} />
                      </View>
                      <Text
                        style={{
                          fontSize: theme.fontSize - 1,
                          color: '#666',
                          flexShrink: 0,
                          lineHeight: metrics.metadataLineHeight,
                          marginTop: 0,
                        }}
                      >
                        {getDateRange(project.startDate, project.endDate, project.current, translations.present)}
                      </Text>
                    </View>

                    {hasProjectDescription ? (
                      <View style={{ marginTop: listTopMargin, minWidth: 0 }}>
                        <DescriptionLines
                          items={project.description}
                          keyPrefix={`proj-${project.id}`}
                          theme={theme}
                          renderMarkdown={renderMarkdown}
                          lineHeight={metrics.detailLineHeight}
                          showBulletPoints={project.showBulletPoints !== false}
                          itemGap={descriptionGap}
                        />
                      </View>
                    ) : null}

                    {project.showTechnologies !== false &&
                    project.technologies &&
                    project.technologies.length > 0 ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', marginTop: listTopMargin }}>
                        {renderTechnologyPills(
                          project.id,
                          project.technologies,
                          isCompact ? 4 : project.technologies.length,
                          theme,
                          metrics
                        )}

                        {project.technologies.length > (isCompact ? 4 : project.technologies.length) ? (
                          <ProjectTechnologyPill
                            label={`+${project.technologies.length - 4}`}
                            theme={theme}
                            metrics={metrics}
                            muted
                          />
                        ) : null}
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {project.showProofs !== false && projectProofs.length > 0 ? (
                <View style={{ marginTop: metrics.isDenseLayout ? 1.5 : (isCompact ? 2 : 2.5), marginLeft: proofIndent }}>
                  {projectProofs.map((proof) => (
                    <SelectableBlock
                      key={proof.id}
                      anchor={projectProofAnchor(project.id, proof.id)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: metrics.isDenseLayout ? 0 : 0.5 }}>
                        <Text style={{ fontSize: theme.fontSize - 1, color: '#9ca3af', width: pxToPt(metrics.isDenseLayout ? 6 : 8), flexShrink: 0 }}>
                          •
                        </Text>
                        <Text
                          style={{
                            fontSize: theme.fontSize - 1,
                            color: '#374151',
                            flex: 1,
                            lineHeight: metrics.detailLineHeight,
                          }}
                        >
                          {renderMarkdown(proof.summary)}
                          {proof.refs.map((ref) => {
                            const href = sanitizeUrl(ref.url);
                            const label = ` ${formatProofRefLabel(ref)}`;

                            return linksEnabled && href && isSafePdfUrl(href) ? (
                              <Link
                                key={ref.id}
                                href={href}
                                style={{
                                  color: '#9ca3af',
                                  textDecoration: 'none',
                                  fontSize: theme.fontSize - 2.5,
                                  lineHeight: metrics.detailLineHeight,
                                }}
                              >
                                {label}
                              </Link>
                            ) : (
                              <Text
                                key={ref.id}
                                inline
                                style={{
                                  color: '#9ca3af',
                                  fontSize: theme.fontSize - 2.5,
                                  lineHeight: metrics.detailLineHeight,
                                }}
                              >
                                {label}
                              </Text>
                            );
                          })}
                        </Text>
                      </View>
                    </SelectableBlock>
                  ))}
                </View>
              ) : null}
            </View>
          </SelectableBlock>
        );
      })}
    </View>
  );
}
