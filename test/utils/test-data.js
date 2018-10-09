const DESCRIPTION = {
  'location': {
    'latitude': 35.89421911,
    'longitude': 139.94637467,
  },
  'name': 'string',
  'description': 'string',
  'roomTypes': {
    'room-type-1111': {
      'name': 'string',
      'description': 'string',
      'totalQuantity': 0,
      'occupancy': {
        'min': 1,
        'max': 3,
      },
      'amenities': [
        'TV',
      ],
      'images': [
        'string',
      ],
      'updatedAt': '2018-06-19T13:19:58.190Z',
      'properties': {
        'nonSmoking': 'some',
      },
    },
    'room-type-2222': {
      'name': 'string',
      'description': 'string',
      'totalQuantity': 0,
      'occupancy': {
        'min': 1,
        'max': 3,
      },
      'amenities': [
        'TV',
      ],
      'images': [
        'string',
      ],
      'updatedAt': '2018-06-19T13:19:58.190Z',
      'properties': {
        'nonSmoking': 'some',
      },
    },
    'room-type-3333': {
      'name': 'string',
      'description': 'string',
      'totalQuantity': 0,
      'occupancy': {
        'min': 1,
        'max': 3,
      },
      'amenities': [
        'TV',
      ],
      'images': [
        'string',
      ],
      'updatedAt': '2018-06-19T13:19:58.190Z',
      'properties': {
        'nonSmoking': 'some',
      },
    },

  },
  'contacts': {
    'general': {
      'email': 'joseph.urban@example.com',
      'phone': 44123456789,
      'url': 'string',
      'ethereum': 'string',
      'additionalContacts': [
        {
          'title': 'string',
          'value': 'string',
        },
      ],
    },
  },
  'address': {
    'line1': 'string',
    'line2': 'string',
    'postalCode': 'string',
    'city': 'string',
    'state': 'string',
    'country': 'string',
  },
  'timezone': 'string',
  'currency': 'string',
  'images': [
    'string',
  ],
  'amenities': [
    'WiFi',
  ],
  'updatedAt': '2018-06-19T13:19:58.190Z',
  'defaultCancellationAmount': 0,
  'cancellationPolicies': [
    {
      'amount': 100,
    },
  ],
};

const RATE_PLANS = {
  'rate-plan-1': {
    'name': 'rate plan 1',
    'description': 'string',
    'currency': 'string',
    'price': 123,
    'roomTypeIds': [
      'room-type-1111',
    ],
    'updatedAt': '2018-07-09T09:22:54.548Z',
    'availableForReservation': {
      'from': '2018-07-08',
      'to': '2019-07-09',
    },
    'availableForTravel': {
      'from': '2018-07-09',
      'to': '2019-07-09',
    },
    'modifiers': [
      {
        'adjustment': -3.1,
        'conditions': {
          'from': '2018-01-30',
          'to': '2018-02-20',
          'minLengthOfStay': 2,
          'maxAge': 0,
        },
      },
    ],
    'restrictions': {
      'bookingCutOff': {
        'min': 0,
        'max': 5,
      },
      'lengthOfStay': {
        'min': 0,
        'max': 5,
      },
    },
  },
  'rate-plan-2': {
    'name': 'rate plan 2',
    'description': 'string',
    'currency': 'string',
    'price': 123,
    'roomTypeIds': [
      'room-type-3333',
    ],
    'updatedAt': '2018-07-09T09:22:54.548Z',
    'availableForReservation': {
      'from': '2018-07-08',
      'to': '2019-07-09',
    },
    'availableForTravel': {
      'from': '2018-07-09',
      'to': '2019-07-09',
    },
    'modifiers': [
      {
        'adjustment': -3.1,
        'conditions': {
          'from': '2018-01-30',
          'to': '2018-02-20',
          'minLengthOfStay': 2,
          'maxAge': 0,
        },
      },
    ],
    'restrictions': {
      'bookingCutOff': {
        'min': 0,
        'max': 5,
      },
      'lengthOfStay': {
        'min': 0,
        'max': 5,
      },
    },
  },
};

const AVAILABILITY = {
  'latestSnapshot': {
    'updatedAt': '2018-07-09T09:22:54.548Z',
    'availability': {
      'room-type-1111': [
        {
          'date': '2018-07-07',
          'quantity': 8,
          'restrictions': {
            'noArrival': true,
          },
        },
        {
          'date': '2018-07-08',
          'quantity': 7,
          'restrictions': {
            'noDeparture': true,
          },
        },
        {
          'date': '2018-07-09',
          'quantity': 1,
        },
        {
          'date': '2018-07-10',
          'quantity': 5,
        },
        {
          'date': '2018-07-11',
          'quantity': 4,
        },
        {
          'date': '2018-07-12',
          'quantity': 10,
        },
        {
          'date': '2018-07-13',
          'quantity': 11,
        },
        {
          'date': '2018-07-14',
          'quantity': 6,
          'restrictions': {
            'noArrival': true,
          },
        },
        {
          'date': '2018-07-15',
          'quantity': 7,
          'restrictions': {
            'noDeparture': true,
          },
        },
      ],
      'room-type-2222': [
        {
          'date': '2018-07-07',
          'quantity': 2,
          'restrictions': {
            'noArrival': true,
          },
        },
        {
          'date': '2018-07-08',
          'quantity': 2,
          'restrictions': {
            'noDeparture': true,
          },
        },
        {
          'date': '2018-07-09',
          'quantity': 2,
        },
        {
          'date': '2018-07-10',
          'quantity': 1,
        },
        {
          'date': '2018-07-11',
          'quantity': 0,
        },
        {
          'date': '2018-07-12',
          'quantity': 0,
        },
        {
          'date': '2018-07-13',
          'quantity': 0,
        },
        {
          'date': '2018-07-14',
          'quantity': 0,
          'restrictions': {
            'noArrival': true,
          },
        },
        {
          'date': '2018-07-15',
          'quantity': 0,
          'restrictions': {
            'noDeparture': true,
          },
        },
      ],
    },
  },
};

module.exports = {
  DESCRIPTION,
  RATE_PLANS,
  AVAILABILITY,
};
