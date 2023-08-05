import {
  CancellationToken,
  ExtensionContext,
  Hover,
  languages,
  Position,
  ProviderResult,
  TextDocument,
} from 'coc.nvim';
import { getTranslateHover } from './translate';

export async function activate(context: ExtensionContext): Promise<void> {
  // 注册假hover，避免coc检查hover provider时报错
  context.subscriptions.push(
    languages.registerHoverProvider(['*'], {
      provideHover(): ProviderResult<Hover> {
        return;
      },
    })
  );

  // 把翻译结果移到最后面
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
