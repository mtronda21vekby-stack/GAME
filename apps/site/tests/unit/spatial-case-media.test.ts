import {describe,it,expect} from "vitest";
import {shouldPlayCasePreview} from "../../src/components/spatial/CaseMedia";

describe("Case preview playback intent",()=>{
  const active={open:true,paused:false,hidden:false,reduced:false,requested:false,stopped:false};
  it("allows a newly attached healthy case without retaining a previous case's failure/stop",()=>{
    expect(shouldPlayCasePreview(active)).toBe(true);
    expect(shouldPlayCasePreview({...active,stopped:true})).toBe(false);
    expect(shouldPlayCasePreview({...active,open:false})).toBe(false);
  });
  it("respects an explicit stop across visibility and global pause/resume",()=>{
    for(const hidden of [true,false])for(const paused of [true,false])expect(shouldPlayCasePreview({...active,hidden,paused,stopped:true})).toBe(false);
    expect(shouldPlayCasePreview({...active,hidden:true})).toBe(false);
    expect(shouldPlayCasePreview({...active,paused:true})).toBe(false);
  });
  it("requires an explicit request under reduced motion, still respecting a later stop",()=>{
    expect(shouldPlayCasePreview({...active,reduced:true})).toBe(false);
    expect(shouldPlayCasePreview({...active,reduced:true,requested:true})).toBe(true);
    expect(shouldPlayCasePreview({...active,reduced:true,requested:true,stopped:true})).toBe(false);
  });
});
