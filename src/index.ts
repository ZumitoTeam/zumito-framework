/* eslint-disable check-file/filename-naming-convention */
import {
    PresenceDataRule,
    RuledPresenceData,
    StatusManagerOptions,
} from './definitions/StatusManagerOptions.js';

import { ApiResponse } from './definitions/api/ApiResponse.js';
import { ButtonPressed } from './definitions/parameters/ButtonPressed.js';
import { ButtonPressedParams } from './definitions/parameters/ButtonPressedParams.js';
import { Command } from './definitions/commands/Command.js';
import { CommandArgDefinition } from './definitions/commands/CommandArgDefinition.js';
import { CommandArguments } from './definitions/commands/CommandArguments.js';
import { CommandChoiceDefinition } from './definitions/commands/CommandChoiceDefinition.js';
import { CommandParameters } from './definitions/commands/CommandParameters.js';
import { CommandType } from './definitions/commands/CommandType.js';
import { DatabaseConfigLoader } from './services/DatabaseConfigLoader.js';
import { DatabaseModel } from './definitions/DatabaseModel.js';
import { EmojiFallback } from './services/EmojiFallback.js';
import { FrameworkEvent } from './definitions/FrameworkEvent.js';
import { FrameworkSettings } from './definitions/FrameworkSettings.js';
import { Module } from './definitions/Module.js';
import { SelectMenuParameters } from './definitions/parameters/SelectMenuParameters.js';
import { TextFormatter } from './services/TextFormatter.js';
import { Translation } from './definitions/Translation.js';
import { TranslationManager } from './services/TranslationManager.js';
import { ZumitoFramework } from './ZumitoFramework.js';
import * as discord from 'discord.js';
import { EventParameters } from './definitions/parameters/EventParameters.js';
import { ServiceContainer } from './services/ServiceContainer.js';
import { GuildDataGetter } from './services/GuildDataGetter.js';
import { MemberPermissionChecker } from './services/MemberPermissionChecker.js';
import { CommandParser } from './services/CommandParser.js';
import { SlashCommandRefresher } from './services/SlashCommandRefresher.js';
import { ErrorHandler } from './services/ErrorHandler.js';
import { Route, RouteMethod } from './definitions/Route.js';
import { InteractionHandler } from './services/InteractionHandler.js';
import { CommandManager } from './services/CommandManager.js';
import { ErrorType } from './definitions/ErrorType.js';
export { ModalSubmitParameters } from './definitions/parameters/ModalSubmitParameters.js'
export { CommandBinds } from './definitions/commands/CommandBinds.js'

ServiceContainer.addService(TextFormatter, []);
ServiceContainer.addService(EmojiFallback, [discord.Client.name, TranslationManager.name]);
ServiceContainer.addService(GuildDataGetter, [ZumitoFramework.name]);
ServiceContainer.addService(MemberPermissionChecker, []);
ServiceContainer.addService(CommandParser, []);
ServiceContainer.addService(SlashCommandRefresher, [ZumitoFramework.name]);
ServiceContainer.addService(InteractionHandler, []);

ServiceContainer.addService(ErrorHandler, ['ZumitoFramework']);

export {
    ZumitoFramework,
    FrameworkSettings,
    Command,
    Module,
    CommandParameters,
    CommandArguments,
    FrameworkEvent,
    Translation,
    TranslationManager,
    ApiResponse,
    SelectMenuParameters,
    CommandType,
    CommandArgDefinition,
    CommandChoiceDefinition,
    ButtonPressed,
    ButtonPressedParams,
    TextFormatter,
    EmojiFallback,
    DatabaseConfigLoader,
    DatabaseModel,
    PresenceDataRule,
    RuledPresenceData,
    StatusManagerOptions,
    discord,
    EventParameters,
    ServiceContainer,
    GuildDataGetter,
    SlashCommandRefresher,
    CommandParser,
    ErrorHandler,
    ErrorType,
    Route,
    RouteMethod,
    InteractionHandler,
    CommandManager
};
