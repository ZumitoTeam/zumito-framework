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
import { DatabaseConfigLoader } from './services/utilities/DatabaseConfigLoader.js';
import { EmojiFallback } from './services/EmojiFallback.js';
import { FrameworkEvent } from './definitions/FrameworkEvent.js';
import { FrameworkSettings } from './definitions/FrameworkSettings.js';
import { Module } from './definitions/Module.js';
import { SelectMenuParameters } from './definitions/parameters/SelectMenuParameters.js';
import { TextFormatter } from './services/utilities/TextFormatter.js';
import { Translation } from './definitions/Translation.js';
import { TranslationManager } from './services/managers/TranslationManager.js';
import { ZumitoFramework } from './ZumitoFramework.js';
import * as discord from 'discord.js';
import { EventParameters } from './definitions/parameters/EventParameters.js';
import { ServiceContainer } from './services/ServiceContainer.js';
import { GuildDataGetter } from './services/utilities/GuildDataGetter.js';
import { MemberPermissionChecker } from './services/utilities/MemberPermissionChecker.js';
import { CommandParser } from './services/CommandParser.js';
import { SlashCommandRefresher } from './services/SlashCommandRefresher.js';
import { ErrorHandler } from './services/handlers/ErrorHandler.js';
import { Route, RouteMethod } from './definitions/Route.js';
import { InteractionHandler } from './services/handlers/InteractionHandler.js';
import { CommandManager } from './services/managers/CommandManager.js';
import { ErrorType } from './definitions/ErrorType.js';
import { InviteUrlGenerator } from './services/utilities/InviteUrlGenerator.js';
import { PrefixResolver } from './services/utilities/PrefixResolver.js';
export { ModalSubmitParameters } from './definitions/parameters/ModalSubmitParameters.js'
export { CommandBinds } from './definitions/commands/CommandBinds.js'
export { Injectable } from './definitions/decorators/Injectable.decorator.js'
export { LauncherConfig } from './definitions/config/LauncherConfig.js'

ServiceContainer.addService(TextFormatter, []);
ServiceContainer.addService(EmojiFallback, [discord.Client.name, TranslationManager.name]);
ServiceContainer.addService(GuildDataGetter, [ZumitoFramework.name]);
ServiceContainer.addService(MemberPermissionChecker, []);
ServiceContainer.addService(CommandParser, []);
ServiceContainer.addService(SlashCommandRefresher, [ZumitoFramework.name]);
ServiceContainer.addService(InteractionHandler, []);
ServiceContainer.addService(InviteUrlGenerator, []);

ServiceContainer.addService(PrefixResolver, []);

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
    CommandManager,
    InviteUrlGenerator,
    PrefixResolver,
};
