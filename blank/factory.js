"use strict";
/**
 * @license
 * Copyright Google LLC All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
function addSchematicToCollectionJson(collectionPath, schematicName, description) {
    return (tree) => {
        const collectionJsonContent = tree.read(collectionPath);
        if (!collectionJsonContent) {
            throw new Error('Invalid collection path: ' + collectionPath);
        }
        const collectionJson = JSON.parse(collectionJsonContent.toString());
        if (!core_1.isJsonObject(collectionJson.schematics)) {
            throw new Error('Invalid collection.json; schematics needs to be an object.');
        }
        collectionJson['schematics'][schematicName] = description;
        tree.overwrite(collectionPath, JSON.stringify(collectionJson, undefined, 2));
    };
}
function default_1(options) {
    const schematicsVersion = require('@angular-devkit/schematics/package.json').version;
    const coreVersion = require('@angular-devkit/core/package.json').version;
    // Verify if we need to create a full project, or just add a new schematic.
    return (tree, context) => {
        if (!options.name) {
            throw new schematics_1.SchematicsException('name option is required.');
        }
        let collectionPath;
        try {
            const packageJsonContent = tree.read('/package.json');
            if (packageJsonContent) {
                const packageJson = JSON.parse(packageJsonContent.toString());
                if (typeof packageJson.schematics === 'string') {
                    const p = core_1.normalize(packageJson.schematics);
                    if (tree.exists(p)) {
                        collectionPath = p;
                    }
                }
            }
        }
        catch { }
        let source = schematics_1.apply(schematics_1.url('./schematic-files'), [
            schematics_1.template({
                ...options,
                coreVersion,
                schematicsVersion,
                dot: '.',
                camelize: core_1.strings.camelize,
                dasherize: core_1.strings.dasherize,
            }),
        ]);
        // Simply create a new schematic project.
        if (!collectionPath) {
            collectionPath = core_1.normalize('/' + options.name + '/src/collection.json');
            source = schematics_1.apply(schematics_1.url('./project-files'), [
                schematics_1.template({
                    ...options,
                    coreVersion,
                    schematicsVersion,
                    dot: '.',
                    camelize: core_1.strings.camelize,
                    dasherize: core_1.strings.dasherize,
                }),
                schematics_1.mergeWith(source),
                schematics_1.move(options.name),
            ]);
            context.addTask(new tasks_1.NodePackageInstallTask(options.name));
        }
        return schematics_1.chain([
            schematics_1.mergeWith(source),
            addSchematicToCollectionJson(collectionPath, core_1.strings.dasherize(options.name), {
                description: 'A blank schematic.',
                factory: './' + core_1.strings.dasherize(options.name) + '/index#' + core_1.strings.camelize(options.name),
            }),
        ]);
    };
}
exports.default = default_1;
