import { forwardRef, type ComponentType } from 'react';
import type { View } from 'react-native';

import { BigMapCard } from './share-templates/bigmap';
import { ClassicCard } from './share-templates/classic';
import { CARD_ASPECT, type ShareCardData, type TemplateProps } from './share-templates/common';
import { MinimalCard } from './share-templates/minimal';
import { NeonCard } from './share-templates/neon';
import { PosterCard } from './share-templates/poster';

export { CARD_ASPECT };
export type { ShareCardData };

export type TemplateId = 'classic' | 'poster' | 'bigmap' | 'minimal' | 'neon';

export const SHARE_TEMPLATES: {
  id: TemplateId;
  label: string;
  Component: ComponentType<TemplateProps & { ref?: React.Ref<View> }>;
}[] = [
  { id: 'classic', label: 'Classic', Component: ClassicCard },
  { id: 'poster', label: 'Poster', Component: PosterCard },
  { id: 'bigmap', label: 'Big map', Component: BigMapCard },
  { id: 'minimal', label: 'Minimal', Component: MinimalCard },
  { id: 'neon', label: 'Neon', Component: NeonCard },
];

type ShareCardProps = TemplateProps & { template?: TemplateId };

/** Renders the chosen template (Classic by default). The ref points at the card for capture. */
export const ShareCard = forwardRef<View, ShareCardProps>(function ShareCard(
  { template = 'classic', data, width },
  ref,
) {
  const { Component } = SHARE_TEMPLATES.find((t) => t.id === template) ?? SHARE_TEMPLATES[0];
  return <Component ref={ref} data={data} width={width} />;
});
