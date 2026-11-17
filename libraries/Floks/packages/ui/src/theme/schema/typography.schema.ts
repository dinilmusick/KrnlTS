import { z } from 'zod';

export const HeadingLevelSchema = z.object({
  font: z.string().optional(),
  fontSize: z.string().optional(),
  fontWeight: z.union([z.string(), z.number()]).optional(),
  lineHeight: z.string().optional(),
  letterSpacing: z.string().optional(),
  color: z.string().optional(),
  borderBottom: z.string().optional(),
  textTransform: z.string().optional()
});

export const ParagraphStyleSchema = z.object({
  font: z.string().optional(),
  fontSize: z.string().optional(),
  fontWeight: z.union([z.string(), z.number()]).optional(),
  lineHeight: z.string().optional(),
  color: z.string().optional(),
  opacity: z.union([z.string(), z.number()]).optional(),
  textAlign: z.string().optional()
});

export const BlockquoteStyleSchema = z.object({
  font: z.string().optional(),
  fontSize: z.string().optional(),
  fontStyle: z.string().optional(),
  color: z.string().optional(),
  bg: z.string().optional(),
  borderLeftColor: z.string().optional(),
  borderLeftWidth: z.string().optional(),
  calloutTitle: z.string().optional(),
  calloutColor: z.string().optional()
});

export const ListStyleSchema = z.object({
  font: z.string().optional(),
  fontSize: z.string().optional(),
  lineHeight: z.string().optional(),
  markerColor: z.string().optional(),
  spacing: z.string().optional()
});

export const CodeStyleSchema = z.object({
  font: z.string().optional(),
  fontSize: z.string().optional(),
  color: z.string().optional(),
  bg: z.string().optional(),
  border: z.string().optional(),
  radius: z.string().optional(),
  headerBg: z.string().optional(),
  shadow: z.string().optional()
});

export const TableStyleSchema = z.object({
  font: z.string().optional(),
  headerBg: z.string().optional(),
  headerColor: z.string().optional(),
  border: z.string().optional(),
  cellBg: z.string().optional(),
  cellPadding: z.string().optional()
});

export const LinkStyleSchema = z.object({
  color: z.string().optional(),
  textDecoration: z.string().optional(),
  hoverColor: z.string().optional(),
  hoverUnderline: z.boolean().optional()
});

export const HorizontalRuleStyleSchema = z.object({
  color: z.string().optional(),
  borderStyle: z.string().optional(),
  height: z.string().optional()
});

export const MarkdownSectionStylesSchema = z.object({
  h1: HeadingLevelSchema.optional(),
  h2: HeadingLevelSchema.optional(),
  h3: HeadingLevelSchema.optional(),
  h4: HeadingLevelSchema.optional(),
  h5: HeadingLevelSchema.optional(),
  h6: HeadingLevelSchema.optional(),
  p: ParagraphStyleSchema.optional(),
  blockquote: BlockquoteStyleSchema.optional(),
  ul: ListStyleSchema.optional(),
  ol: ListStyleSchema.optional(),
  inlineCode: CodeStyleSchema.optional(),
  codeBlock: CodeStyleSchema.optional(),
  table: TableStyleSchema.optional(),
  link: LinkStyleSchema.optional(),
  hr: HorizontalRuleStyleSchema.optional()
});

export const ThemeTypographySchema = z.object({
  globalFont: z.string(),
  globalMonoFont: z.string(),
  globalColor: z.string().optional(),
  globalAccentColor: z.string().optional(),
  headingFont: z.string().optional(),
  bodyFont: z.string().optional(),
  codeFont: z.string().optional(),
  sections: MarkdownSectionStylesSchema.optional()
});

export type HeadingLevelDefinition = z.infer<typeof HeadingLevelSchema>;
export type ParagraphStyleDefinition = z.infer<typeof ParagraphStyleSchema>;
export type BlockquoteStyleDefinition = z.infer<typeof BlockquoteStyleSchema>;
export type ListStyleDefinition = z.infer<typeof ListStyleSchema>;
export type CodeStyleDefinition = z.infer<typeof CodeStyleSchema>;
export type TableStyleDefinition = z.infer<typeof TableStyleSchema>;
export type LinkStyleDefinition = z.infer<typeof LinkStyleSchema>;
export type MarkdownSectionStyles = z.infer<typeof MarkdownSectionStylesSchema>;
export type ThemeTypographyDefinition = z.infer<typeof ThemeTypographySchema>;
