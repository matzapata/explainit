import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ChatsService } from '@src/modules/chat/chat.service';
import {
  originFromWebsiteUrl,
  frameAncestorsCsp,
} from '@src/modules/chat/visitor-context';
import { EnvService } from '@src/infra/env/env.service';

function clientOrigin(corsOrigin: string): string {
  const first = corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)[0];
  return first && first !== '*'
    ? first.replace(/\/$/, '')
    : 'http://localhost:3000';
}

@Controller('host')
export class HostController {
  constructor(
    private readonly chatsService: ChatsService,
    private readonly env: EnvService,
  ) {}

  @Get('/:id')
  async hostChat(
    @Param('id') id: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const chat = await this.chatsService.findFirstById(id);
    if (!chat) {
      throw new NotFoundException('Chat not found');
    }
    if (!chat.published && !req.currentUser) {
      throw new NotFoundException('Chat not found');
    }

    const allowedOrigin = originFromWebsiteUrl(chat.url);
    if (!allowedOrigin) {
      throw new NotFoundException('Chat not found');
    }

    const appOrigin = clientOrigin(this.env.get('CORS_ORIGIN'));
    const isDev = this.env.get('NODE_ENV') !== 'production';
    const scriptSrc = isDev
      ? `${appOrigin}/src/host-frame.tsx`
      : `${appOrigin}/host-frame.js`;

    res.setHeader(
      'Content-Security-Policy',
      frameAncestorsCsp(allowedOrigin, {
        development: this.env.get('NODE_ENV') === 'development',
      }),
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');

    res.send(`<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Ask AI</title>
    <script>window.__EXPLAINIT_CHAT_ID__=${JSON.stringify(id)};</script>
    ${
      isDev
        ? `<script type="module">
      import RefreshRuntime from ${JSON.stringify(`${appOrigin}/@react-refresh`)};
      RefreshRuntime.injectIntoGlobalHook(window);
      window.$RefreshReg$ = () => {};
      window.$RefreshSig$ = () => (type) => type;
      window.__vite_plugin_react_preamble_installed__ = true;
    </script>
    <script type="module" src="${appOrigin}/@vite/client"></script>`
        : ''
    }
    <script type="module" src="${scriptSrc}"></script>
    <style>
      html, body, #root {
        height: 100%;
        margin: 0;
        background: transparent !important;
        color-scheme: light !important;
      }
    </style>
  </head>
  <body class="dark">
    <div id="root"></div>
  </body>
</html>`);
  }
}
