module.exports = {
  'type': 'object',
  'description': 'A single update notification.',
  'definitions': {
    'HotelSubjects': {
      'type': 'array',
      'items': {
        'type': 'string',
        'enum': [
          'ratePlans',
          'availability',
          'description',
          'dataIndex',
          'onChain',
        ],
      },
    },
    'CreatedScope': {
      'type': 'object',
      'description': 'Hotel creation scope.',
      'required': [
        'action',
      ],
      'properties': {
        'action': {
          'type': 'string',
          'enum': [
            'create',
          ],
        },
      },
    },
    'UpdatedScope': {
      'type': 'object',
      'description': 'Hotel update scope.',
      'required': [
        'action',
      ],
      'properties': {
        'action': {
          'type': 'string',
          'enum': [
            'update',
          ],
        },
        'subjects': {
          'oneOf': [
            { '$ref': '#/definitions/HotelSubjects' },
          ],
        },
      },
    },
    'DeletedScope': {
      'type': 'object',
      'description': 'Hotel deletion scope.',
      'required': [
        'action',
      ],
      'properties': {
        'action': {
          'type': 'string',
          'enum': [
            'delete',
          ],
        },
      },
    },
  },
  'required': [
    'wtIndex',
    'resourceType',
    'resourceAddress',
    'scope',
  ],
  'properties': {
    'wtIndex': {
      'description': 'Helps to uniquely identify the resource in question.',
      'type': 'string',
      'format': 'eth-address',
    },
    'resourceType': {
      'description': 'Specifies the type of resource (hotel, ...) to be followed. (We assume multiple resource types will exist in the future.)',
      'type': 'string',
      'enum': [
        'hotel',
      ],
    },
    'resourceAddress': {
      'description': 'Limit subscription to a specific resource (e.g. a specific hotel).',
      'type': 'string',
      'format': 'eth-address',
    },
    'scope': {
      'description': 'Select the notification scope.',
      'oneOf': [
        { '$ref': '#/definitions/CreatedScope' },
        { '$ref': '#/definitions/UpdatedScope' },
        { '$ref': '#/definitions/DeletedScope' },
      ],
    },
  },
};
