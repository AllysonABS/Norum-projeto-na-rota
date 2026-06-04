import React, {useState} from 'react';
import {View, Image, TouchableOpacity, StyleSheet} from 'react-native';
import ImageViewer from './ImageViewer';

type Props = {
  fotos: {id: string; url: string}[];
};

export default function PhotoGallery({fotos}: Props) {
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  return (
    <>
      <View style={s.row}>
        {fotos.map(f => (
          <TouchableOpacity key={f.id} onPress={() => setSelectedUrl(f.url)} activeOpacity={0.8}>
            <Image source={{uri: f.url}} style={s.thumb} />
          </TouchableOpacity>
        ))}
      </View>
      <ImageViewer
        visible={!!selectedUrl}
        url={selectedUrl || ''}
        onClose={() => setSelectedUrl(null)}
      />
    </>
  );
}

const s = StyleSheet.create({
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: 10},
  thumb: {width: 100, height: 100, borderRadius: 10},
});
