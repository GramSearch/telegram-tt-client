import 'v8-compile-cache';

import { app, ipcMain, nativeImage } from 'electron';
import contextMenu from 'electron-context-menu';
import path from 'path';

import { initDeeplink } from './deeplink';
import { IS_MAC_OS, IS_PRODUCTION, IS_WINDOWS } from './utils';
import { createWindow, setupCloseHandlers, setupElectronActionHandlers } from './window';
import { ElectronAction, ElectronEvent } from '../types/electron';
import { createCoreInstance, initDrizzle, initLogger } from '@tg-search/core';
import { initConfig } from '@tg-search/common/node';
import { DatabaseType } from '@tg-search/common';

initDeeplink();

contextMenu({
  showLearnSpelling: false,
  showLookUpSelection: false,
  showSearchWithGoogle: false,
  showCopyImage: false,
  showSelectAll: true,
  showInspectElement: !IS_PRODUCTION,
});

app.on('ready', async () => {
  if (IS_MAC_OS) {
    app.dock?.setIcon(nativeImage.createFromPath(path.resolve(__dirname, '../public/icon-electron-macos.png')));
  }

  if (IS_WINDOWS) {
    app.setAppUserModelId(app.getName());
  }

  try {
    const logger = initLogger()
    const config = await initConfig();

    // Add validation before initializing
    if (!config || !config.database) {
      logger.error('Config validation failed');
      return;
    }

    await initDrizzle(logger, {
      ...config,
      database: {
        type: DatabaseType.PGLITE,
      },
    }, path.resolve(__dirname, '../data/drizzle.db'));

    const ctx = createCoreInstance(config);

    // Add error handling for IPC message processing
    ipcMain.on(ElectronAction.SEND_TO_SEARCH_CORE, (event, msg) => {
      try {
        // Validate message structure before processing
        if (!msg || !msg.payload || !msg.payload.messages) {
          logger.warn('Invalid message format received:', msg);
          return;
        }

        ctx.emitter.emit('message:process', msg);
      } catch (error) {
        logger.error('Error processing search core message:', error);
      }
    });

    // Add error handling for core events
    ctx.emitter.on('message:process', (message) => {
      try {
        const windows = require('./utils').windows;
        windows.forEach((window: any) => {
          if (window && !window.isDestroyed()) {
            window.webContents.send(ElectronEvent.SEARCH_CORE_MESSAGE, message);
          }
        });
      } catch (error) {
        logger.error('Error sending message to renderer:', error);
      }
    });

  } catch (error) {
    console.error('Failed to initialize search core:', error);
    // Continue without search functionality
  }

  createWindow();
  setupElectronActionHandlers();
  setupCloseHandlers();
});
