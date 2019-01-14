'use strict';

const path = require('path');

// Check if a given Program is only a re-export statement
function isReExportOnly(program) {
  return isExportOnly(program) && exportIsReExport(program.body[0]);
}

// Check if a given Program is only an export statement
function isExportOnly(program) {
  return program.body.length === 1 && program.body[0].type === 'ExportNamedDeclaration';
}

function isRenamedExport(specifier) {
  return specifier.local.name !== specifier.exported.name;
}

// Check if the given export statement is a re-export
function exportIsReExport(exportNamedDeclaration) {
  if (
    !(
      !!exportNamedDeclaration.source &&
      !!exportNamedDeclaration.specifiers.length
    )
  ) {
    return false;
  }

  for (let i = 0; i < exportNamedDeclaration.specifiers.length; i++) {
    let specifier = exportNamedDeclaration.specifiers[i];

    if (isRenamedExport(specifier)) {
      return false;
    }
  }

  return true;
}

// Get the source of a re-export for the given Program
function getReExportSource(program) {
  return program.body[0].source.value;
}

// Constructs a define.alias expression for the given source and alias
function constructDefineAlias(t, source, alias) {
  return t.expressionStatement(
    t.callExpression(
      t.memberExpression(
        t.identifier('define'),
        t.identifier('alias')
      ),
      [
        t.stringLiteral(source),
        t.stringLiteral(alias)
      ]
    )
  );
}

function CompactReexports(babel) {
  const t = babel.types;

  return {
    visitor: {
      Program:{
        // On enter, we check if the program is a re-export
        enter(path, state) {
          const program = path.node;
          if (isReExportOnly(program)) {
            state.reexport = {
              source: getReExportSource(program)
            };
          }
        },

        // On exit, if the program is a re-export, we rewrite it to an alias
        exit(path, state) {
          if (state.reexport) {
            const source = state.reexport.source;
            const alias = this.getModuleName();
            const newProgram = t.program( [ constructDefineAlias(t, source, alias) ] );

            path.replaceWith(newProgram);
            path.stop();
          }
        }
      }
    }
  };
}

// Provide the path to the package's base directory for caching with broccoli
// Ref: https://github.com/babel/broccoli-babel-transpiler#caching
CompactReexports.baseDir = function() { return path.resolve(__dirname, '..'); };

module.exports = CompactReexports;
