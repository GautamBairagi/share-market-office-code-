const fs = require('fs');

const appFile = 'src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// Replace standard setView with handleBack in onBack and onClose handlers
content = content.replace(/onBack=\{([^=>]*)\s*=>\s*setView\((['"`].+?['"`])\)\}/g, "onBack={$1 => handleBack($2)}");
content = content.replace(/onClose=\{([^=>]*)\s*=>\s*setView\((['"`].+?['"`])\)\}/g, "onClose={$1 => handleBack($2)}");

// Also handle the multi-line replacement for ClientDetailsForm
let multiLineRegex = /onBack=\{\(\) => \{\s*const role = selectedClient\?\.role;\s*if \(role === 'ADMIN'\) setView\('admins'\);\s*else if \(role === 'BROKER'\) setView\('brokers'\);\s*else setView\('trading-clients'\);\s*\}\}/;

let replacementMultiLine = `onBack={() => {
                        const role = selectedClient?.role;
                        if (role === 'ADMIN') handleBack('admins');
                        else if (role === 'BROKER') handleBack('brokers');
                        else handleBack('trading-clients');
                    }}`;

content = content.replace(multiLineRegex, replacementMultiLine);

// Inject handleBack method
if (!content.includes('const handleBack')) {
    const handleBackFn = `    const handleBack = (fallback) => {
        if (window.history.length > 2) {
            navigate(-1);
        } else {
            navigate('/' + fallback);
        }
    };`;

    content = content.replace(
        "    const setView = (v) => {\r\n        navigate(`/${v}`);\r\n    };",
        "    const setView = (v) => {\n        navigate(`/${v}`);\n    };\n\n" + handleBackFn
    );
     content = content.replace(
        "    const setView = (v) => {\n        navigate(`/${v}`);\n    };",
        "    const setView = (v) => {\n        navigate(`/${v}`);\n    };\n\n" + handleBackFn
    );
}

fs.writeFileSync(appFile, content);
console.log('App.jsx routing patched successfully.');
