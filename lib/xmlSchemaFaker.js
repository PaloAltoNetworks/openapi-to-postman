/* eslint-disable */
const _get = require('lodash/get'),
  _constant = require('lodash/constant'),
  _forOwn = require('lodash/forOwn'),
  _times = require('lodash/times');

function convertSchemaToXML(name, schema, attribute, indentChar, inden) {
  var tagPrefix = '',
    cInden = _times(inden, _constant(indentChar)).join('');
  name = _get(schema, 'xml.name', name || 'element');
  if (_get(schema, 'xml.prefix')) {
    tagPrefix = schema.xml.prefix + ':';
  }
  if (['integer', 'string'].includes(schema.type)) {
    if (schema.type === 'integer') {
      actualValue = '(integer)';
    } else if (schema.type === 'string') {
      actualValue = '(string)';
    }
    if (attribute) {
      return actualValue;
    } else {
      var retVal = '\n' + cInden + '<' + tagPrefix + name;
      if (_get(schema, 'xml.namespace')) {
        retVal +=
          ' xmlns:' +
          tagPrefix.slice(0, -1) +
          '="' +
          schema.xml.namespace +
          '"';
      }
      retVal += '>' + actualValue + '</' + tagPrefix + name + '>';
    }
  } else if (schema.type === 'object') {
    // go through all properties
    var retVal = '\n' + cInden + `<${tagPrefix + name}`,
      propVal,
      attributes = [],
      childNodes = '';
    if (_get(schema, 'xml.namespace')) {
      retVal +=
        ' xmlns:' + tagPrefix.slice(0, -1) + '="' + schema.xml.namespace + '"';
    }
    _forOwn(schema.properties, (value, key) => {
      propVal = convertSchemaToXML(
        key,
        value,
        _get(value, 'xml.attribute'),
        indentChar,
        inden + 1
      );
      if (_get(value, 'xml.attribute')) {
        attributes.push(key + '="' + propVal + '"');
      } else {
        childNodes += propVal;
      }
    });
    if (attributes.length > 0) {
      retVal += ' ' + attributes.join(' ');
    }
    retVal += '>';
    retVal += childNodes;
    retVal += '\n</' + name + '>';
  } else if (schema.type === 'array') {
    // schema.items must be an object
    var isWrapped = _get(schema, 'xml.wrapped'),
      extraIndent = isWrapped ? 1 : 0;
    var arrayElemName = _get(schema, 'items.xml.name', name, 'arrayItem');
    var contents =
      convertSchemaToXML(
        arrayElemName,
        schema.items,
        false,
        indentChar,
        inden + extraIndent
      ) +
      convertSchemaToXML(
        arrayElemName,
        schema.items,
        false,
        indentChar,
        inden + extraIndent
      );
    if (isWrapped) {
      return (
        '\n' +
        cInden +
        '<' +
        name +
        '>' +
        contents +
        '\n' +
        cInden +
        '</' +
        name +
        '>'
      );
    } else {
      return contents;
    }
  }
  return retVal;
}

module.exports = function (name, schema, indentCharacter) {
  // substring(1) to trim the leading newline
  return convertSchemaToXML(name, schema, false, indentCharacter, 0).substring(
    1
  );
};
/*
a = convertSchemaToXML('Person',{
  "type": "object",
  "properties": {
    "id": {
      "type": "integer",
      "format": "int32",
      "xml": {
        "attribute": true
      }
    },
    "name": {
      "type": "string",
      "xml": {
        "namespace": "http://example.com/schema/sample",
        "prefix": "sample"
      }
    },
    "animals": {
      "type": "array",
      "items": {
        "type": "string",
        "xml": {
          "name": "animal"
        }
      },
      "xml": {
        "name": "aliens",
        "wrapped": true
      }
    }
  },
  xml: {
    namespace: "www.kane.com",
    "prefix": "M"
  }
}, false, 0);

console.log(a);
*/
