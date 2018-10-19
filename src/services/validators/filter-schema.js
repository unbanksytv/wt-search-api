module.exports = {
  'definitions': {
    'LocationFilter': {
      'type': 'object',
      'required': ['type', 'condition'],
      'properties': {
        'type': {
          'type': 'string',
          'enum': ['location'],
        },
        'condition': {
          'type': 'object',
          'required': ['lat', 'lng', 'distance'],
          'properties': {
            'lat': {
              'type': 'number',
              'min': -90,
              'max': 90,
            },
            'lng': {
              'type': 'number',
              'minimum': -180,
              'maximum': 180,
            },
            'distance': {
              'type': 'number',
              'minimum': 0,
              'maximum': 200,
            },
          },
        },
      },
    },
  },
  'type': 'array',
  'items': {
    'type': 'object',
    'oneOf': [
      { '$ref': '#/definitions/LocationFilter' },
    ],
  },
};
