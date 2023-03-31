import { CancellationToken, ExtensionContext, Hover, languages, Position, TextDocument } from 'coc.nvim';
import { getTranslateHover } from './translate';

export async function activate(_context: ExtensionContext): Promise<void> {
  //@ts-ignore
  const { hoverManager } = languages;
  const provideHover = hoverManager.provideHover;
  hoverManager.provideHover = async (document: TextDocument, position: Position, token: CancellationToken) => {
    const hovers: Hover[] = await provideHover.apply(hoverManager, [document, position, token]);
    try {
      const hover = await getTranslateHover(document, position, token);
      if (hover) hovers.push(hover);
    } catch (e) {
      console.log(e);
    }
    return hovers;
  };
}
