import { CancellationToken, Hover, Position, TextDocument, workspace } from 'coc.nvim';
import humps from 'humps';
import path from 'path';

// 单词拆分
// 例: foor-bar 拆分为 [foo, bar]
function getWordArray(character: string) {
  let formatChar = character;
  const capitalizes = formatChar.match(/[A-Z\s]{2,}/g);
  if (capitalizes && capitalizes.length) {
    capitalizes.map((item) => {
      formatChar = formatChar.replace(item, humps.pascalize(item.toLowerCase()));
    });
  }
  if (!formatChar) {
    return;
  }
  // 判断是否全大写
  if (/^[A-Z]+$/.test(character)) {
    return [character.toLowerCase()];
  }
  return Array.from(new Set(humps.decamelize(humps.camelize(formatChar), { separator: '|' }).split('|')));
}

function cleanWord(character: string) {
  return character.replace(/"/g, '');
}

type QueryResult = {
  t: string;
  p: string;
};

function query(word: string): Promise<QueryResult> {
  return new Promise((resolve) => {
    let ret: QueryResult = { t: '', p: '' };
    if (word) {
      const prefix = word.substring(0, 2);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      let dict = require(path.join(path.dirname(__dirname), 'dict', `${prefix}.json`));
      const data = dict[word];
      if (data) {
        ret =
          typeof data == 'string'
            ? {
                t: data,
                p: '',
              }
            : {
                t: data.t,
                p: data.p,
              };
        dict = null;
      }
    }
    resolve(ret);
  });
}

const genMarkdown = function (word: string, t: string, _p: string) {
  if (t) return `- ${word}\n` + t.replace(/\\n/g, `\n`);
  return '';
};

export async function getTranslateHover(
  document: TextDocument,
  position: Position,
  _token: CancellationToken
): Promise<Hover | undefined> {
  const doc = workspace.getDocument(document.uri);
  const range = doc.getWordRangeAtPosition(position);
  if (!range) return;
  let text = document.getText(range);
  if (!text) return;
  // const selectText = document.getText(window.activeTextEditor.selection);
  // if (selectText && text.indexOf(selectText) > -1) text = selectText;

  text = cleanWord(text);
  const words = getWordArray(text);
  if (!words) return;

  let hoverText = '';
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const ret = await query(word);
    const markdown = genMarkdown(word, ret.t, ret.p);
    if (markdown) {
      if (i == 0) {
        hoverText += '\n' + markdown;
      } else {
        hoverText += '\n---\n' + markdown;
      }
    }
  }
  return { contents: hoverText + '\n' };
}
