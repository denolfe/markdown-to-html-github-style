import showdown from 'showdown';
import fs from 'fs';
import path from 'path';
import hljs from 'highlight.js';

async function main() {
  let converter: showdown.Converter;
  const readmePath = path.resolve(process.argv?.[2] || 'README.md');
  console.log('Converting ' + readmePath);
  showdown.extension('highlight', function () {
    const htmlUnencode = (text: string) => {
      return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
    };

    return [
      {
        type: 'output',
        filter: function (text, converter, options) {
          const left = '<pre><code\\b[^>]*>',
            right = '</code></pre>',
            flags = 'g';

          const replacement: typeof showdown.helper.replaceRecursiveRegExp = function (
            wholeMatch,
            match,
            left,
            right,
          ) {
            match = htmlUnencode(match);
            const lang = (left.match(/class=\"([^ \"]+)/) || [])[1];
            left = left.slice(0, 18) + 'hljs ' + left.slice(18);
            if (lang && hljs.getLanguage(lang)) {
              return left + hljs.highlight(match, { language: lang }).value + right;
            } else {
              return left + hljs.highlightAuto(match).value + right;
            }
          };
          return showdown.helper.replaceRecursiveRegExp(text, replacement, left, right, flags);
        },
      },
    ];
  });

  const vscodeDarkStyles = await fs.promises.readFile(
    path.join(__dirname, 'styles/style-vscode-dark-plus.css'),
    'utf-8',
  );
  const readmeContent = await fs.promises.readFile(readmePath, 'utf-8');

  converter = new showdown.Converter({
    ghCompatibleHeaderId: true,
    simpleLineBreaks: true,
    ghMentions: true,
    extensions: ['highlight'],
    tables: true,
  });

  const html = `<html>
        <head>
          <title></title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <meta charset="UTF-8">
        </head>
        <body>
          <div id='content'>
            ${converter.makeHtml(readmeContent)}
          </div>
          <style type='text/css'>${vscodeDarkStyles}</style>
        </body>
      </html>`;

  converter.setFlavor('github');

  let outputPath = readmePath.replace('.md', '.html');
  await fs.promises.writeFile(outputPath, html, { flag: 'w' });
  console.log('Done, saved to ' + outputPath);
}

main();
