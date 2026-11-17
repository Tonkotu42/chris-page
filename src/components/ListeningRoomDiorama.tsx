import React from 'react';

interface ListeningRoomDioramaProps {
  isPlaying: boolean;
  isDeckSpinningUp: boolean;
}

export const ListeningRoomDiorama: React.FC<ListeningRoomDioramaProps> = ({
  isPlaying,
  isDeckSpinningUp,
}) => {
  return (
    <div
      className={`music-room-diorama ${isPlaying ? 'is-playing' : ''} ${isDeckSpinningUp ? 'is-inserting' : ''}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 180 126"
        shapeRendering="crispEdges"
        className="music-room-diorama-svg"
      >
        {/* Isometric diorama floor slab */}
        <g className="diorama-base">
          {/* Cutaway slab thickness */}
          <polygon points="16,79 90,116 90,123 16,86" fill="#232834" />
          <polygon points="90,116 164,79 164,86 90,123" fill="#151821" />
          <polygon points="16,85 90,122 90,123 16,86" fill="#0b0d12" />
          <polygon points="90,122 164,85 164,86 90,123" fill="#0b0d12" />

          {/* Main floor top diamond */}
          <polygon points="90,42 164,79 90,116 16,79" fill="#1f242f" />
          {/* Subtle wood floorboard strips */}
          <line x1="34" y1="70" x2="108" y2="107" stroke="#181c26" strokeWidth="1" />
          <line x1="52" y1="61" x2="126" y2="98" stroke="#181c26" strokeWidth="1" />
          <line x1="70" y1="52" x2="144" y2="89" stroke="#181c26" strokeWidth="1" />
          {/* Floor top bevel edge */}
          <polyline points="16,79 90,116 164,79" fill="none" stroke="#3c4456" strokeWidth="1" />
          <polyline points="16,79 90,42 164,79" fill="none" stroke="#0d0f15" strokeWidth="1" />

          {/* Back-edge studio low trim */}
          <polygon points="16,79 90,42 90,38 16,75" fill="#2b3140" />
          <polygon points="90,42 164,79 164,75 90,38" fill="#1b202b" />
          <polyline points="16,75 90,38 164,75" fill="none" stroke="#454e63" strokeWidth="1" />

          {/* Cozy woven isometric rug */}
          <polygon points="90,62 130,82 90,102 50,82" fill="#323946" />
          <polygon points="90,65 124,82 90,99 56,82" fill="#262c37" />
          <polyline points="90,63 128,82 90,101 52,82 90,63" fill="none" stroke="#4f5a6e" strokeWidth="1" />
          <rect x="89" y="64" width="2" height="1" fill="#00ff66" opacity="0.7" />
          <rect x="89" y="99" width="2" height="1" fill="#00ff66" opacity="0.7" />
        </g>

        {/* 1. 本棚 (Bookshelf) - back-left */}
        <g className="diorama-bookshelf">
          {/* Shadow */}
          <polygon points="44,67 74,52 79,55 49,70" fill="#0d1017" opacity="0.55" />
          {/* Dark outline */}
          <polygon points="39,26 65,13 73,17 73,51 47,64 39,60" fill="#120b07" />
          {/* Side panel (right) */}
          <polygon points="65,14 72,18 72,50 65,46" fill="#3e2516" />
          {/* Top surface */}
          <polygon points="40,26 65,14 72,18 47,30" fill="#7c4e31" />
          {/* Front cabinet face */}
          <polygon points="40,26 47,30 47,63 40,59" fill="#54331f" />
          {/* Bookshelf interior (facing right-front) */}
          <polygon points="47,30 72,18 72,50 47,63" fill="#5e3a23" />

          {/* Shelf 1 (top) recess + books */}
          <polygon points="49,31 70,21 70,29 49,39" fill="#1c120c" />
          <polygon points="50,32 52,31 52,37 50,38" fill="#c94a4a" />
          <polygon points="52,31 54,30 54,36 52,37" fill="#e6dec8" />
          <polygon points="54,30 56,29 56,35 54,36" fill="#3c8d83" />
          <polygon points="57,28 59,27 59,34 57,35" fill="#d99d3e" />
          <polygon points="59,27 61,26 61,33 59,34" fill="#4f6894" />
          <polygon points="63,25 65,24 66,30 64,31" fill="#92b07a" />
          <polygon points="66,24 68,23 68,29 66,30" fill="#c9744d" />

          {/* Shelf 2 (middle) recess + books */}
          <polygon points="49,41 70,31 70,39 49,49" fill="#1c120c" />
          <polygon points="50,42 52,41 52,47 50,48" fill="#5e8753" />
          <polygon points="52,41 54,40 54,46 52,47" fill="#bf5a39" />
          <polygon points="55,39 58,38 58,44 55,45" fill="#d6c59c" />
          <polygon points="59,38 61,37 61,43 59,44" fill="#6f83a6" />
          <polygon points="62,36 64,35 64,41 62,42" fill="#e6e6e6" />
          <polygon points="65,35 68,33 68,39 65,41" fill="#00ff66" opacity="0.7" />

          {/* Shelf 3 (bottom) recess + vinyl sleeves / boxes */}
          <polygon points="49,51 70,41 70,49 49,59" fill="#1c120c" />
          <polygon points="50,53 54,51 54,56 50,58" fill="#825b3a" />
          <polygon points="55,50 58,49 58,54 55,55" fill="#466e64" />
          <polygon points="60,47 64,45 64,51 60,53" fill="#cfc3a7" />
          <polygon points="65,44 69,42 69,48 65,50" fill="#3a3d47" />

          {/* Potted trailing plant on top-left of bookshelf */}
          <rect x="44" y="21" width="6" height="5" fill="#120b07" />
          <rect x="45" y="21" width="4" height="4" fill="#b35c37" />
          <rect x="45" y="21" width="4" height="1" fill="#d1774f" />
          <g className="diorama-plant">
            <rect x="43" y="17" width="8" height="4" fill="#326336" />
            <rect x="44" y="15" width="6" height="4" fill="#4f944e" />
            <rect x="45" y="14" width="4" height="3" fill="#70bd64" />
            <rect x="42" y="19" width="2" height="5" fill="#4f944e" />
            <rect x="42" y="23" width="2" height="2" fill="#70bd64" />
          </g>

          {/* Warm desk lamp on top-right of bookshelf */}
          <rect x="59" y="16" width="4" height="2" fill="#2a2d36" />
          <rect x="61" y="12" width="1" height="4" fill="#454957" />
          <rect x="58" y="10" width="6" height="3" fill="#d99a3b" />
          <rect x="59" y="12" width="4" height="2" fill="#ffe28a" className="diorama-lamp-glow" />
        </g>

        {/* 2. 左スピーカ (Left Studio Speaker) */}
        <g className="diorama-speaker diorama-speaker-left">
          <polygon points="21,74 37,66 42,69 26,77" fill="#0d1017" opacity="0.55" />
          {/* Dark outline */}
          <polygon points="21,49 30,44 38,48 38,72 29,77 21,73" fill="#0e1015" />
          {/* Wood top & left side */}
          <polygon points="22,49 30,45 37,48 29,52" fill="#734b32" />
          <polygon points="22,49 29,52 29,76 22,72" fill="#4e3221" />
          {/* Speaker baffle facing right-down */}
          <polygon points="29,52 37,48 37,71 29,76" fill="#20232b" />
          {/* Tweeter */}
          <rect x="31" y="54" width="4" height="3" fill="#101216" />
          <rect x="32" y="55" width="2" height="1" fill="#a8abb5" />
          {/* Main Woofer */}
          <rect x="30" y="60" width="6" height="7" fill="#111318" />
          <g className="diorama-speaker-woofer">
            <rect x="31" y="61" width="4" height="5" fill="#353a47" />
            <rect x="32" y="62" width="2" height="3" fill="#181a20" />
            <rect x="32" y="63" width="2" height="1" fill="#6b7285" />
          </g>
          {/* Power LED */}
          <rect x="31" y="69" width="2" height="1" fill="#00ff66" className="diorama-led" />
        </g>

        {/* 3. ソファ (Sofa) - back-right */}
        <g className="diorama-sofa">
          {/* Floor shadow */}
          <polygon points="73,60 88,52 126,71 111,79" fill="#0d1017" opacity="0.55" />
          {/* Wooden feet */}
          <rect x="77" y="58" width="2" height="3" fill="#3d2414" />
          <rect x="108" y="73" width="2" height="3" fill="#3d2414" />
          <rect x="120" y="67" width="2" height="3" fill="#3d2414" />

          {/* Sofa base outline */}
          <polygon points="73,45 92,35 126,52 126,68 109,76 73,58" fill="#101713" />

          {/* Backrest */}
          <polygon points="86,39 92,36 125,52 119,55" fill="#4f7861" />
          <polygon points="86,39 119,55 119,64 86,48" fill="#395947" />
          <polygon points="119,55 125,52 125,67 119,70" fill="#23382d" />

          {/* Left armrest */}
          <polygon points="74,45 86,39 90,41 78,47" fill="#496e59" />
          <polygon points="74,45 78,47 78,58 74,56" fill="#2c4537" />
          <polygon points="78,47 90,41 90,52 78,58" fill="#375745" />

          {/* Cushions */}
          <polygon points="79,52 91,46 118,59 106,65" fill="#4f7a62" />
          <line x1="94" y1="59" x2="104" y2="54" stroke="#2c4537" strokeWidth="1" />
          {/* Front cushion depth */}
          <polygon points="78,53 106,66 106,73 78,59" fill="#345241" />

          {/* Right armrest */}
          <polygon points="106,62 118,56 125,59 113,65" fill="#496e59" />
          <polygon points="106,62 113,65 113,74 106,71" fill="#314d3d" />
          <polygon points="113,65 125,59 125,67 113,74" fill="#23382d" />

          {/* Cozy mustard throw pillow */}
          <polygon points="90,46 95,43 99,48 94,51" fill="#e0a444" />
          <polygon points="90,46 94,51 94,53 90,49" fill="#b37b27" />

          {/* Tiny sleeping pixel cat/plush on sofa corner */}
          <g className="diorama-cat">
            <rect x="106" y="54" width="7" height="4" fill="#f0c4d4" />
            <rect x="107" y="53" width="2" height="1" fill="#f0c4d4" />
            <rect x="110" y="53" width="2" height="1" fill="#f0c4d4" />
            <rect x="108" y="55" width="1" height="1" fill="#231c24" />
            <rect x="111" y="55" width="1" height="1" fill="#231c24" />
            <rect x="113" y="56" width="2" height="1" fill="#e09cb4" className="diorama-cat-tail" />
          </g>
        </g>

        {/* 4. 右スピーカ (Right Studio Speaker) */}
        <g className="diorama-speaker diorama-speaker-right">
          <polygon points="126,78 142,70 147,73 131,81" fill="#0d1017" opacity="0.55" />
          {/* Dark outline */}
          <polygon points="127,54 136,50 144,54 144,78 136,82 127,78" fill="#0e1015" />
          {/* Wood top & right side */}
          <polygon points="128,54 136,51 143,54 135,58" fill="#734b32" />
          <polygon points="135,58 143,54 143,77 135,81" fill="#3a2518" />
          {/* Speaker baffle facing left-down */}
          <polygon points="128,54 135,58 135,81 128,77" fill="#22252e" />
          {/* Tweeter */}
          <rect x="130" y="59" width="4" height="3" fill="#101216" />
          <rect x="131" y="60" width="2" height="1" fill="#a8abb5" />
          {/* Main Woofer */}
          <rect x="129" y="65" width="5" height="7" fill="#111318" />
          <g className="diorama-speaker-woofer">
            <rect x="130" y="66" width="3" height="5" fill="#353a47" />
            <rect x="131" y="67" width="1" height="3" fill="#181a20" />
            <rect x="131" y="68" width="1" height="1" fill="#6b7285" />
          </g>
          {/* Power LED */}
          <rect x="131" y="75" width="2" height="1" fill="#00ff66" className="diorama-led" />
        </g>

        {/* 5. CHRIS Character listening inside the room */}
        <g className="diorama-chris">
          <ellipse cx="69" cy="80" rx="6" ry="3" fill="#0d1017" opacity="0.55" />
          <g className="diorama-chris-body">
            {/* Feet */}
            <rect x="65" y="77" width="3" height="2" fill="#e5e5e5" />
            <rect x="70" y="77" width="3" height="2" fill="#e5e5e5" />
            {/* Legs */}
            <rect x="65" y="74" width="3" height="3" fill="#2c313b" />
            <rect x="70" y="74" width="3" height="3" fill="#2c313b" />
            {/* Hoodie torso */}
            <rect x="64" y="66" width="10" height="8" fill="#111318" />
            <rect x="65" y="67" width="8" height="6" fill="#eceef2" />
            <rect x="67" y="69" width="4" height="2" fill="#00ff66" />
            {/* Arms */}
            <rect x="62" y="67" width="2" height="5" fill="#dcdde3" className="diorama-chris-arm-l" />
            <rect x="74" y="67" width="2" height="5" fill="#dcdde3" className="diorama-chris-arm-r" />
            {/* Head + hair + green headphones */}
            <rect x="63" y="55" width="12" height="11" fill="#0b0c10" />
            <rect x="65" y="57" width="8" height="8" fill="#f2e6dc" />
            <rect x="64" y="55" width="10" height="4" fill="#3a2f2b" />
            <rect x="62" y="58" width="2" height="5" fill="#00ff66" />
            <rect x="74" y="58" width="2" height="5" fill="#00ff66" />
            <rect x="66" y="60" width="1" height="2" fill="#111318" />
            <rect x="71" y="60" width="1" height="2" fill="#111318" />
          </g>
        </g>

        {/* 6. 小さなテーブル (Small Coffee Table) - center foreground */}
        <g className="diorama-table">
          {/* Table shadow on rug */}
          <polygon points="73,89 91,80 109,89 91,98" fill="#0d1017" opacity="0.55" />
          {/* Legs */}
          <rect x="74" y="84" width="2" height="6" fill="#4f301b" />
          <rect x="89" y="91" width="2" height="7" fill="#3d2414" />
          <rect x="104" y="84" width="2" height="6" fill="#3d2414" />
          {/* Tabletop outline */}
          <polygon points="71,82 90,72 109,82 109,85 90,95 71,85" fill="#140c07" />
          {/* Tabletop surface */}
          <polygon points="72,82 90,73 108,82 90,91" fill="#9c6943" />
          <line x1="78" y1="82" x2="96" y2="85" stroke="#855635" strokeWidth="1" opacity="0.5" />
          {/* Tabletop thickness */}
          <polygon points="72,82 90,91 90,94 72,85" fill="#6b4429" />
          <polygon points="90,91 108,82 108,85 90,94" fill="#4a2e1a" />

          {/* Small tape / player box on table */}
          <polygon points="88,81 95,78 100,81 93,84" fill="#2b2e38" />
          <polygon points="88,81 93,84 93,86 88,83" fill="#181a21" />
          <rect x="92" y="80" width="3" height="1" fill="#00ff66" />

          {/* Coffee mug + rising steam */}
          <rect x="81" y="77" width="4" height="4" fill="#f2f2f2" />
          <rect x="85" y="78" width="1" height="2" fill="#d4d4d4" />
          <rect x="82" y="77" width="2" height="1" fill="#693f22" />
          <g className="diorama-steam">
            <rect x="82" y="74" width="1" height="2" fill="#e5e7eb" opacity="0.7" />
            <rect x="83" y="71" width="1" height="2" fill="#e5e7eb" opacity="0.5" />
          </g>
        </g>

        {/* Animated sound waves & pixel notes when playing */}
        {isPlaying && (
          <g className="diorama-music-fx">
            {/* Left speaker sound pulses */}
            <path d="M39 58 h2 v2 h-2 z M42 55 h2 v6 h-2 z" fill="#00ff66" className="diorama-wave diorama-wave-l" />
            {/* Right speaker sound pulses */}
            <path d="M124 62 h2 v2 h-2 z M121 59 h2 v6 h-2 z" fill="#00ff66" className="diorama-wave diorama-wave-r" />
            {/* Floating pixel music notes */}
            <g className="diorama-note diorama-note-1">
              <rect x="43" y="42" width="2" height="5" fill="#00ff66" />
              <rect x="43" y="42" width="4" height="1" fill="#00ff66" />
              <rect x="41" y="46" width="3" height="2" fill="#00ff66" />
            </g>
            <g className="diorama-note diorama-note-2">
              <rect x="122" y="44" width="2" height="5" fill="#e5e7eb" />
              <rect x="122" y="44" width="4" height="1" fill="#e5e7eb" />
              <rect x="120" y="48" width="3" height="2" fill="#e5e7eb" />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
