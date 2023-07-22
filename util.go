package main

import "encoding/json"

func BeautifyJson(jsonBuf []byte) []byte {
	var data any
	if err := json.Unmarshal(jsonBuf, &data); err != nil {
		return jsonBuf
	}
	buf, err := json.MarshalIndent(data, "", "    ")
	if err != nil {
		return jsonBuf
	}
	return buf
}
