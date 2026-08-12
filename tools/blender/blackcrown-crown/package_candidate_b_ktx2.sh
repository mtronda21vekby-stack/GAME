#!/bin/sh

set -eu

if [ "$#" -ne 2 ]; then
  printf '%s\n' "Usage: package_candidate_b_ktx2.sh SOURCE_DIR OUTPUT_DIR" >&2
  exit 2
fi

if ! command -v toktx >/dev/null 2>&1; then
  printf '%s\n' "Candidate B KTX2 packaging blocked: 'toktx' is not installed or not on PATH." >&2
  printf '%s\n' "Install KTX-Software separately, then rerun this local wrapper. No download was attempted." >&2
  exit 1
fi

source_dir=$1
output_dir=$2
mkdir -p "$output_dir"

for source in "$source_dir"/*BaseColor.png; do
  [ -f "$source" ] || continue
  name=$(basename "$source" .png)
  toktx --t2 --encode etc1s --genmipmap --assign_oetf srgb "$output_dir/$name.ktx2" "$source"
done

for source in "$source_dir"/*Normal.png; do
  [ -f "$source" ] || continue
  name=$(basename "$source" .png)
  toktx --t2 --encode uastc --uastc_quality 2 --genmipmap --assign_oetf linear "$output_dir/$name.ktx2" "$source"
done

for source in "$source_dir"/*ORM.png; do
  [ -f "$source" ] || continue
  name=$(basename "$source" .png)
  toktx --t2 --encode etc1s --genmipmap --assign_oetf linear "$output_dir/$name.ktx2" "$source"
done

printf '%s\n' "Candidate B KTX2 package written to $output_dir"
