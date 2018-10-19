module.exports = {
  'definitions': {
    'DistanceSort': {
      'type': 'object',
      'required': ['type', 'data'],
      'properties': {
        'type': {
          'type': 'string',
          'enum': ['location'],
        },
        'data': {
          'type': 'object',
          'required': ['lat', 'lng'],
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
          },
        },
      },
    },
  },
  'type': 'object',
  'oneOf': [
    { '$ref': '#/definitions/DistanceSort' },
  ],
};
