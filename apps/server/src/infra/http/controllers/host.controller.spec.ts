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
import { originFromWebsiteUrl } from '@src/modules/chat/visitor-context';
import { EnvService } from '@src/infra/env/env.service';
import { HostController } from './host.controller';

describe('HostController', () => {
  const chatsService = {
    findFirstById: jest.fn(),
  };
  const env = {
    get: jest.fn((key: string): string | undefined => {
      if (key === 'CORS_ORIGIN') return 'http://localhost:3000';
      if (key === 'NODE_ENV') return 'test';
      return undefined;
    }),
  };

  const controller = new HostController(
    chatsService as unknown as ChatsService,
    env as unknown as EnvService,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    env.get.mockImplementation((key: string): string | undefined => {
      if (key === 'CORS_ORIGIN') return 'http://localhost:3000';
      if (key === 'NODE_ENV') return 'test';
      return undefined;
    });
  });

  it('serves Host Chat HTML with frame-ancestors from Chat.url', async () => {
    chatsService.findFirstById.mockResolvedValue({
      id: 'chat-1',
      published: true,
      url: 'https://docs.example.com/guide',
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    await controller.hostChat(
      'chat-1',
      { currentUser: null } as never,
      res as never,
    );

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      'frame-ancestors https://docs.example.com',
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining('window.__EXPLAINIT_CHAT_ID__="chat-1"'),
    );
    expect(res.send).toHaveBeenCalledWith(
      expect.stringContaining('/@react-refresh'),
    );
  });

  it('also allows localhost Host pages in development', async () => {
    env.get.mockImplementation((key: string): string | undefined => {
      if (key === 'CORS_ORIGIN') return 'http://localhost:3000';
      if (key === 'NODE_ENV') return 'development';
      return undefined;
    });
    chatsService.findFirstById.mockResolvedValue({
      id: 'chat-1',
      published: true,
      url: 'https://clerk.com/docs/guides/users/inviting',
    });
    const res = {
      setHeader: jest.fn(),
      send: jest.fn(),
    };

    await controller.hostChat(
      'chat-1',
      { currentUser: null } as never,
      res as never,
    );

    expect(res.setHeader).toHaveBeenCalledWith(
      'Content-Security-Policy',
      'frame-ancestors https://clerk.com http://localhost:* http://127.0.0.1:*',
    );
  });

  it('404s unpublished Host Chat for anonymous Visitors', async () => {
    chatsService.findFirstById.mockResolvedValue({
      id: 'chat-1',
      published: false,
      url: 'https://docs.example.com',
    });

    await expect(
      controller.hostChat(
        'chat-1',
        { currentUser: null } as never,
        { setHeader: jest.fn(), send: jest.fn() } as never,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('404s when Website is unset', async () => {
    chatsService.findFirstById.mockResolvedValue({
      id: 'chat-1',
      published: true,
      url: null,
    });

    await expect(
      controller.hostChat(
        'chat-1',
        { currentUser: null } as never,
        { setHeader: jest.fn(), send: jest.fn() } as never,
      ),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
