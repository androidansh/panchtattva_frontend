import { useEffect, useRef } from "react";

import {
  Viewer,
  Terrain,
  Cartesian3,
  Color,
  createWorldTerrainAsync
} from "cesium";

import "cesium/Build/Cesium/Widgets/widgets.css";

function CesiumMap() {

  const containerRef = useRef(null);

  const viewerRef = useRef(null);

  useEffect(() => {

    let viewer;

    async function createMap() {

      viewer = new Viewer(
        containerRef.current,
        {
          terrainProvider:
            await createWorldTerrainAsync(),

          animation: false,

          timeline: false,

          baseLayerPicker: true,

          geocoder: true,

          homeButton: true,

          sceneModePicker: true,

          navigationHelpButton: true
        }
      );

      viewerRef.current = viewer;


      // Fly to Patna

      viewer.camera.flyTo({

        destination: Cartesian3.fromDegrees(
          85.1376,
          25.5941,
          25000
        ),

        orientation: {

          heading: 0,

          pitch:
            -0.7,

          roll: 0

        },

        duration: 2

      });


      // Example Patna area

      viewer.entities.add({

        name:
          "Patna Watershed Area",

        position:
          Cartesian3.fromDegrees(
            85.1376,
            25.5941,
            500
          ),

        point: {

          pixelSize: 12,

          color:
            Color.LIME,

          outlineColor:
            Color.WHITE,

          outlineWidth: 2

        }

      });

    }

    createMap();


    return () => {

      if (
        viewer &&
        !viewer.isDestroyed()
      ) {

        viewer.destroy();

      }

    };

  }, []);


  return (

    <div

      ref={containerRef}

      style={{

        width: "100%",

        height: "100%"

      }}

    />

  );

}

export default CesiumMap;