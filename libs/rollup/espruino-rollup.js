const { writeFileSync, vol } = require('fs');
const rollup = require('rollup');
const espruinoModules = require('rollup-plugin-espruino-modules');

function bundle(options) {
    console.log(`running Rollup version ${rollup.VERSION}`);

    if (typeof vol !== 'undefined') { // only in browser (fs = memfs)
        vol.fromJSON({'/modules': null});

        if (options.modules) {
            try {
              options.modules.forEach(([name, code]) => writeFileSync(name, code));
            } catch (err) {
              console.log('err', err);
            }
            delete options.modules;
        }
    }

    const warnings = [];

    const config = espruinoModules.buildEspruinoConfig(options);

    config.onwarn = ( warning ) => {
        warnings.push( warning );

        console.group( warning.loc ? warning.loc.file : '' );

        console.warn( warning.message );

        if ( warning.frame ) {
            console.log( warning.frame );
        }

        if ( warning.url ) {
            console.log( `See ${warning.url} for more information` );
        }

        console.groupEnd();
    };

    return rollup.rollup(config).then(bundle => {
        console.log({
            imports: bundle.imports,
            exports: bundle.exports
        });

        return bundle.generate(config.output).then(generated => {
            console.log({ warnings });
            return generated.code;
        });
    }).catch(error => {
        console.log('error', ({ error }));
        if ( error.frame ) console.log( error.frame );
        throw error;
    });
}

function minify(code, options) {
    return new Promise((resolve, reject) => {
        try {
            const minifyOptions = espruinoModules.buildEspruinoMinifyConfig(options)
            const minified = espruinoModules.espruinoMinify(code, minifyOptions);
            resolve(minified.code);
        } catch(e) {
            reject(e);
        }
    });
}

module.exports = {
    bundle,
    minify
}
