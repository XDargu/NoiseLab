const exampleEye = {
  "last_node_id": 22,
  "last_link_id": 32,
  "nodes": [
    {
      "id": 6,
      "type": "Math/Multiply",
      "pos": {
        "0": 621,
        "1": 44,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 10,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 21
        },
        {
          "name": "B",
          "type": "array",
          "link": 20
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            10
          ],
          "slot_index": 0
        }
      ],
      "title": "Multiply",
      "properties": {}
    },
    {
      "id": 3,
      "type": "Transform/Offset",
      "pos": {
        "0": 185,
        "1": -134,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 7,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 2
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            21
          ],
          "slot_index": 0
        }
      ],
      "title": "Offset",
      "properties": {
        "offsetX": 0,
        "offsetY": 0.29481170546371493
      }
    },
    {
      "id": 1,
      "type": "Generator/Stripes",
      "pos": {
        "0": -85,
        "1": -137,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 268
      },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            2
          ],
          "slot_index": 0
        }
      ],
      "title": "Stripes",
      "properties": {
        "frequency": 1,
        "width": 0.47935830150604253,
        "softness": 0.20018383368136958,
        "vertical": false
      }
    },
    {
      "id": 2,
      "type": "Transform/Cartesian to Polar",
      "pos": {
        "0": 820,
        "1": 40,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 12,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 10
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            22
          ],
          "slot_index": 0
        }
      ],
      "title": "Cartesian to Polar",
      "properties": {
        "scale": 1.0791793418128985
      }
    },
    {
      "id": 15,
      "type": "Math/Add",
      "pos": {
        "0": 1137.3607177734375,
        "1": 93.25616455078125,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 13,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 22
        },
        {
          "name": "B",
          "type": "array",
          "link": 23
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            24
          ],
          "slot_index": 0
        }
      ],
      "title": "Add",
      "properties": {}
    },
    {
      "id": 7,
      "type": "Generator/Circle",
      "pos": {
        "0": 1099,
        "1": 349,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 244
      },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            25
          ],
          "slot_index": 0
        }
      ],
      "title": "Circle",
      "properties": {
        "radius": 0.4317752974749267,
        "x": 0.5035214973218507,
        "y": 0.5035214973218507
      }
    },
    {
      "id": 17,
      "type": "Generator/Circle",
      "pos": {
        "0": 1414.725830078125,
        "1": 397.7767639160156,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 244
      },
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            27
          ],
          "slot_index": 0
        }
      ],
      "title": "Circle",
      "properties": {
        "radius": 0.1331111679077152,
        "x": 0.5020593200067057,
        "y": 0.5035214973218507
      }
    },
    {
      "id": 13,
      "type": "Transform/Cartesian to Polar",
      "pos": {
        "0": 764,
        "1": 332,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 11,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 19
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            23
          ],
          "slot_index": 0
        }
      ],
      "title": "Cartesian to Polar",
      "properties": {
        "scale": 0.8115443188137488
      }
    },
    {
      "id": 4,
      "type": "Generator/DirectionalNoise",
      "pos": {
        "0": -187,
        "1": 219,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 292
      },
      "flags": {},
      "order": 3,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            20
          ],
          "slot_index": 0
        }
      ],
      "title": "DirectionalNoise",
      "properties": {
        "frequency": 5,
        "stretch": 20,
        "amplitude": 1,
        "offset": 0,
        "angle": 0
      }
    },
    {
      "id": 16,
      "type": "Combine/Mix",
      "pos": {
        "0": 1402,
        "1": 86,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 216
      },
      "flags": {},
      "order": 14,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 24
        },
        {
          "name": "B",
          "type": "array",
          "link": 25
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            26
          ],
          "slot_index": 0
        }
      ],
      "title": "Mix / Lerp",
      "properties": {
        "t": 0.12078287678051539
      }
    },
    {
      "id": 14,
      "type": "Math/Multiply",
      "pos": {
        "0": 482,
        "1": 558,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 8,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 28
        },
        {
          "name": "B",
          "type": "array",
          "link": 18
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            19
          ],
          "slot_index": 0
        }
      ],
      "title": "Multiply",
      "properties": {}
    },
    {
      "id": 12,
      "type": "Generator/Stripes",
      "pos": {
        "0": 172,
        "1": 665,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 268
      },
      "flags": {},
      "order": 4,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            18
          ],
          "slot_index": 0
        }
      ],
      "title": "Stripes",
      "properties": {
        "frequency": 1,
        "width": 0.6952134704589835,
        "softness": 0.20874301244784646,
        "vertical": false
      }
    },
    {
      "id": 19,
      "type": "Generator/DirectionalNoise",
      "pos": {
        "0": -189,
        "1": 559,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 292
      },
      "flags": {},
      "order": 5,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            28
          ],
          "slot_index": 0
        }
      ],
      "title": "DirectionalNoise",
      "properties": {
        "frequency": 3.690498513185781,
        "stretch": 32.70483232658882,
        "amplitude": 1.762258356267744,
        "offset": 1.5854906795000703,
        "angle": 0
      }
    },
    {
      "id": 18,
      "type": "Math/Subtract",
      "pos": {
        "0": 1669,
        "1": 99,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 15,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 26
        },
        {
          "name": "B",
          "type": "array",
          "link": 27
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            29
          ],
          "slot_index": 0
        }
      ],
      "title": "Subtract",
      "properties": {}
    },
    {
      "id": 20,
      "type": "Generator/Circle",
      "pos": {
        "0": 1697,
        "1": 403,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 244
      },
      "flags": {},
      "order": 6,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            31
          ],
          "slot_index": 0
        }
      ],
      "title": "Circle",
      "properties": {
        "radius": 0.06765572203749141,
        "x": 0.2822352273624018,
        "y": 0.3189661731842572
      }
    },
    {
      "id": 22,
      "type": "Filter/Blur",
      "pos": {
        "0": 1941,
        "1": 401,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 9,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 31
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            32
          ],
          "slot_index": 0
        }
      ],
      "title": "Blur",
      "properties": {
        "amount": 2.3033446762235146,
        "passes": 3.7977660642078463
      }
    },
    {
      "id": 21,
      "type": "Math/Add",
      "pos": {
        "0": 2231,
        "1": 95,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 16,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 29
        },
        {
          "name": "B",
          "type": "array",
          "link": 32
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": null
        }
      ],
      "title": "Add",
      "properties": {}
    }
  ],
  "links": [
    [
      2,
      1,
      0,
      3,
      0,
      "array"
    ],
    [
      10,
      6,
      0,
      2,
      0,
      "array"
    ],
    [
      18,
      12,
      0,
      14,
      1,
      "array"
    ],
    [
      19,
      14,
      0,
      13,
      0,
      "array"
    ],
    [
      20,
      4,
      0,
      6,
      1,
      "array"
    ],
    [
      21,
      3,
      0,
      6,
      0,
      "array"
    ],
    [
      22,
      2,
      0,
      15,
      0,
      "array"
    ],
    [
      23,
      13,
      0,
      15,
      1,
      "array"
    ],
    [
      24,
      15,
      0,
      16,
      0,
      "array"
    ],
    [
      25,
      7,
      0,
      16,
      1,
      "array"
    ],
    [
      26,
      16,
      0,
      18,
      0,
      "array"
    ],
    [
      27,
      17,
      0,
      18,
      1,
      "array"
    ],
    [
      28,
      19,
      0,
      14,
      0,
      "array"
    ],
    [
      29,
      18,
      0,
      21,
      0,
      "array"
    ],
    [
      31,
      20,
      0,
      22,
      0,
      "array"
    ],
    [
      32,
      22,
      0,
      21,
      1,
      "array"
    ]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};

const exampleVorRocks = {
  "last_node_id": 47,
  "last_link_id": 85,
  "nodes": [
    {
      "id": 6,
      "type": "Generator/CellNoise",
      "pos": {
        "0": 195,
        "1": 245,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 244
      },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            8
          ],
          "slot_index": 0
        }
      ],
      "title": "Cell Noise",
      "properties": {
        "points": 25.21152108776527,
        "thickness": 1.9463230190676881,
        "seed": 875.9550000142981
      }
    },
    {
      "id": 30,
      "type": "Generator/Perlin",
      "pos": {
        "0": 600,
        "1": -114,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 268
      },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            56
          ],
          "slot_index": 0
        }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 11.221610637626238,
        "octaves": 4.512890459267703,
        "amplitude": 0.8686659071180493,
        "offset": 0.9191709576231012
      }
    },
    {
      "id": 33,
      "type": "Math/Scale",
      "pos": {
        "0": 885,
        "1": -101,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 3,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 56
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            57
          ],
          "slot_index": 0
        }
      ],
      "title": "Scale",
      "properties": {
        "amount": 1.2411977132161507
      }
    },
    {
      "id": 8,
      "type": "Math/Invert",
      "pos": {
        "0": 443,
        "1": 247,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 164
      },
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [
        {
          "name": "input",
          "type": "array",
          "link": 8
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            9
          ],
          "slot_index": 0
        }
      ],
      "title": "Invert",
      "properties": {}
    },
    {
      "id": 9,
      "type": "Filter/Blur",
      "pos": {
        "0": 616,
        "1": 246,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 4,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 9
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            52
          ],
          "slot_index": 0
        }
      ],
      "title": "Blur",
      "properties": {
        "amount": 2.9550231210688764,
        "passes": 3.0141540496730537
      }
    },
    {
      "id": 32,
      "type": "Combine/Mask Blend",
      "pos": {
        "0": 1218,
        "1": 128,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 204
      },
      "flags": {},
      "order": 5,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 57
        },
        {
          "name": "B",
          "type": "array",
          "link": null
        },
        {
          "name": "Mask",
          "type": "array",
          "link": 52
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            83
          ],
          "slot_index": 0
        }
      ],
      "title": "Mask Blend",
      "properties": {}
    },
    {
      "id": 44,
      "type": "Math/Subtract",
      "pos": {
        "0": 1404,
        "1": 129,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 6,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 83
        },
        {
          "name": "B",
          "type": "array",
          "link": null
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": null
        }
      ],
      "title": "Subtract",
      "properties": {}
    }
  ],
  "links": [
    [
      8,
      6,
      0,
      8,
      0,
      "array"
    ],
    [
      9,
      8,
      0,
      9,
      0,
      "array"
    ],
    [
      52,
      9,
      0,
      32,
      2,
      "array"
    ],
    [
      56,
      30,
      0,
      33,
      0,
      "array"
    ],
    [
      57,
      33,
      0,
      32,
      0,
      "array"
    ],
    [
      83,
      32,
      0,
      44,
      0,
      "array"
    ]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};

const exampleIsland = {
  "last_node_id": 10,
  "last_link_id": 16,
  "nodes": [
    {
      "id": 6,
      "type": "Generator/FormulaXY",
      "pos": {
        "0": 10,
        "1": 700,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 0,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            5
          ]
        }
      ],
      "properties": {
        "formula": "sqrt(pow(x - 0.5, 2) + pow(y - 0.5, 2)) - 0.3"
      }
    },
    {
      "id": 7,
      "type": "Expression/Formula1",
      "pos": {
        "0": 270,
        "1": 700,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 3,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 5
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            6
          ]
        }
      ],
      "title": "Formula1",
      "properties": {
        "formula": "-a"
      }
    },
    {
      "id": 8,
      "type": "Math/Scale",
      "pos": {
        "0": 530,
        "1": 700,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 5,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 6
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            7
          ]
        }
      ],
      "title": "Scale",
      "properties": {
        "amount": 10
      }
    },
    {
      "id": 9,
      "type": "Math/Clamp",
      "pos": {
        "0": 790,
        "1": 700,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 7,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 7
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            13
          ]
        }
      ],
      "title": "Clamp",
      "properties": {
        "min": -5,
        "max": 0.22
      }
    },
    {
      "id": 2,
      "type": "Generator/Perlin",
      "pos": {
        "0": 5,
        "1": 110,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 268
      },
      "flags": {},
      "order": 1,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            1
          ]
        }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 1.3,
        "octaves": 1,
        "amplitude": 4.7,
        "offset": 2.9
      }
    },
    {
      "id": 3,
      "type": "Math/Scale",
      "pos": {
        "0": 253,
        "1": 121,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 196
      },
      "flags": {},
      "order": 4,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 1
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            2
          ]
        }
      ],
      "title": "Scale",
      "properties": {
        "amount": 0.2
      }
    },
    {
      "id": 4,
      "type": "Math/Clamp",
      "pos": {
        "0": 514,
        "1": 116,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 220
      },
      "flags": {},
      "order": 6,
      "mode": 0,
      "inputs": [
        {
          "name": "value",
          "type": "array",
          "link": 2
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            16
          ],
          "slot_index": 0
        }
      ],
      "title": "Clamp",
      "properties": {
        "min": -3.3,
        "max": 0.75
      }
    },
    {
      "id": 5,
      "type": "Math/Add",
      "pos": {
        "0": 829,
        "1": 376,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 8,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 16
        },
        {
          "name": "B",
          "type": "array",
          "link": 15
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": [
            14
          ],
          "slot_index": 0
        }
      ],
      "title": "Add",
      "properties": {}
    },
    {
      "id": 1,
      "type": "Generator/Perlin",
      "pos": {
        "0": 251,
        "1": 375,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 210,
        "1": 268
      },
      "flags": {},
      "order": 2,
      "mode": 0,
      "inputs": [],
      "outputs": [
        {
          "name": "noise",
          "type": "array",
          "links": [
            15
          ],
          "slot_index": 0
        }
      ],
      "title": "Perlin",
      "properties": {
        "frequency": 6.2,
        "octaves": 4,
        "amplitude": 3.4,
        "offset": 2.6
      }
    },
    {
      "id": 10,
      "type": "Math/Add",
      "pos": {
        "0": 1117,
        "1": 410,
        "2": 0,
        "3": 0,
        "4": 0,
        "5": 0,
        "6": 0,
        "7": 0,
        "8": 0,
        "9": 0
      },
      "size": {
        "0": 140,
        "1": 184
      },
      "flags": {},
      "order": 9,
      "mode": 0,
      "inputs": [
        {
          "name": "A",
          "type": "array",
          "link": 14
        },
        {
          "name": "B",
          "type": "array",
          "link": 13
        }
      ],
      "outputs": [
        {
          "name": "out",
          "type": "array",
          "links": null
        }
      ],
      "title": "Add",
      "properties": {}
    }
  ],
  "links": [
    [
      1,
      2,
      0,
      3,
      0,
      "array"
    ],
    [
      2,
      3,
      0,
      4,
      0,
      "array"
    ],
    [
      5,
      6,
      0,
      7,
      0,
      "array"
    ],
    [
      6,
      7,
      0,
      8,
      0,
      "array"
    ],
    [
      7,
      8,
      0,
      9,
      0,
      "array"
    ],
    [
      13,
      9,
      0,
      10,
      1,
      "array"
    ],
    [
      14,
      5,
      0,
      10,
      0,
      "array"
    ],
    [
      15,
      1,
      0,
      5,
      1,
      "array"
    ],
    [
      16,
      4,
      0,
      5,
      0,
      "array"
    ]
  ],
  "groups": [],
  "config": {},
  "extra": {},
  "version": 0.4
};