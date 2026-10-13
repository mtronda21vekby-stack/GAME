// Private local translation of Box2D recovered from the supplied Raze SWF.
// Raze (c) 2010 Juice-Tin / AddisonR. Original supplied files and attribution are retained.
// Numerical/source parity is not claimed by successful transpilation alone.
(function(root){ "use strict";
const int=x=>Number(x)|0,uint=x=>Number(x)>>>0;
const __as=(type,value)=>value instanceof type ? value : null;
const trace=(...args)=>{};
class ClipVertex {
v = new b2Vec2();
id = new b2ContactID();
constructor() {
         
      
}
}
class Features {
_referenceEdge = 0;
_incidentEdge = 0;
_flip = 0;
_incidentVertex = 0;
_m_id = null;
constructor() {
         
      
}
get referenceEdge() {
         return this._referenceEdge;
      
}
set incidentVertex(param1) {param1=int(param1);
         this._incidentVertex = int(param1);
         this._m_id._key = this._m_id._key & 0xFF00FFFF | this._incidentVertex << 16 & 0xFF0000;
      
}
get flip() {
         return this._flip;
      
}
get incidentEdge() {
         return this._incidentEdge;
      
}
set referenceEdge(param1) {param1=int(param1);
         this._referenceEdge = int(param1);
         this._m_id._key = this._m_id._key & 0xFFFFFF00 | this._referenceEdge & 0xFF;
      
}
set flip(param1) {param1=int(param1);
         this._flip = int(param1);
         this._m_id._key = this._m_id._key & 0xFFFFFF | this._flip << 24 & 0xFF000000;
      
}
get incidentVertex() {
         return this._incidentVertex;
      
}
set incidentEdge(param1) {param1=int(param1);
         this._incidentEdge = int(param1);
         this._m_id._key = this._m_id._key & 0xFFFF00FF | this._incidentEdge << 8 & 0xFF00;
      
}
}
class b2FilterData {
maskBits = 65535;
groupIndex = 0;
categoryBits = 1;
constructor() {
         
      
}
Copy() {
         var _loc1_ = null;
         _loc1_ = new b2FilterData();
         _loc1_.categoryBits = this.categoryBits;
         _loc1_.maskBits = this.maskBits;
         _loc1_.groupIndex = this.groupIndex;
         return _loc1_;
      
}
}
class b2MassData {
mass = 0;
center = new b2Vec2(0,0);
I = 0;
constructor() {
         
      
}
}
class b2Shape {
static s_proxyAABB;
static s_syncAABB;
static s_resetAABB;
static e_unknownShape;
static e_circleShape;
static e_polygonShape;
static e_shapeTypeCount;
m_type = 0;
m_sweepRadius = NaN;
m_density = NaN;
m_filter = null;
m_friction = NaN;
m_next = null;
m_restitution = NaN;
m_userData = null;
m_isSensor = false;
m_proxyId = 0;
m_body = null;
constructor(param1) {
         
         this.m_userData = param1.userData;
         this.m_friction = param1.friction;
         this.m_restitution = param1.restitution;
         this.m_density = param1.density;
         this.m_body = null;
         this.m_sweepRadius = 0;
         this.m_next = null;
         this.m_proxyId = uint(b2Pair.b2_nullProxy);
         this.m_filter = param1.filter.Copy();
         this.m_isSensor = param1.isSensor;
      
}
static Destroy(param1, param2) {
      
}
static Create(param1, param2) {
         switch(param1.type)
         {
            case b2Shape.e_circleShape:
               return new b2CircleShape(param1);
            case b2Shape.e_polygonShape:
               return new b2PolygonShape(param1);
            default:
               return null;
         }
      
}
TestPoint(param1, param2) {
         return false;
      
}
GetSweepRadius() {
         return this.m_sweepRadius;
      
}
GetNext() {
         return this.m_next;
      
}
ComputeSweptAABB(param1, param2, param3) {
      
}
GetType() {
         return this.m_type;
      
}
GetRestitution() {
         return this.m_restitution;
      
}
GetFriction() {
         return this.m_friction;
      
}
GetFilterData() {
         return this.m_filter.Copy();
      
}
TestSegment(param1, param2, param3, param4, param5) {
         return false;
      
}
RefilterProxy(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = false;
         if(this.m_proxyId == b2Pair.b2_nullProxy)
         {
            return;
         }
         param1.DestroyProxy(this.m_proxyId);
         _loc3_ = b2Shape.s_resetAABB;
         this.ComputeAABB(_loc3_,param2);
         _loc4_ = param1.InRange(_loc3_);
         if(_loc4_)
         {
            this.m_proxyId = uint(param1.CreateProxy(_loc3_,this));
         }
         else
         {
            this.m_proxyId = uint(b2Pair.b2_nullProxy);
         }
      
}
SetFilterData(param1) {
         this.m_filter = param1.Copy();
      
}
GetUserData() {
         return this.m_userData;
      
}
Synchronize(param1, param2, param3) {
         var _loc4_ = null;
         if(this.m_proxyId == b2Pair.b2_nullProxy)
         {
            return false;
         }
         _loc4_ = b2Shape.s_syncAABB;
         this.ComputeSweptAABB(_loc4_,param2,param3);
         if(param1.InRange(_loc4_))
         {
            param1.MoveProxy(this.m_proxyId,_loc4_);
            return true;
         }
         return false;
      
}
ComputeMass(param1) {
      
}
IsSensor() {
         return this.m_isSensor;
      
}
DestroyProxy(param1) {
         if(this.m_proxyId != b2Pair.b2_nullProxy)
         {
            param1.DestroyProxy(this.m_proxyId);
            this.m_proxyId = uint(b2Pair.b2_nullProxy);
         }
      
}
UpdateSweepRadius(param1) {
      
}
ComputeAABB(param1, param2) {
      
}
GetBody() {
         return this.m_body;
      
}
CreateProxy(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = false;
         _loc3_ = b2Shape.s_proxyAABB;
         this.ComputeAABB(_loc3_,param2);
         _loc4_ = param1.InRange(_loc3_);
         if(_loc4_)
         {
            this.m_proxyId = uint(param1.CreateProxy(_loc3_,this));
         }
         else
         {
            this.m_proxyId = uint(b2Pair.b2_nullProxy);
         }
      
}
SetUserData(param1) {
         this.m_userData = param1;
      
}
}
class b2ShapeDef {
isSensor = false;
density = 0;
type = b2Shape.e_unknownShape;
restitution = 0;
userData = null;
filter = new b2FilterData();
friction = 0.2;
constructor() {
         
      
}
}
class b2AABB {
upperBound = new b2Vec2();
lowerBound = new b2Vec2();
constructor() {
         
      
}
IsValid() {
         var _loc1_ = NaN;
         var _loc2_ = NaN;
         var _loc3_ = false;
         _loc1_ = this.upperBound.x - this.lowerBound.x;
         _loc2_ = this.upperBound.y - this.lowerBound.y;
         _loc3_ = _loc1_ >= 0 && _loc2_ >= 0;
         return _loc3_ && this.lowerBound.IsValid() && this.upperBound.IsValid();
      
}
}
class b2Bound {
proxyId = 0;
stabbingCount = 0;
value = 0;
constructor() {
         
      
}
Swap(param1) {
         var _loc2_ = 0;
         var _loc3_ = 0;
         var _loc4_ = 0;
         _loc2_ = uint(this.value);
         _loc3_ = uint(this.proxyId);
         _loc4_ = uint(this.stabbingCount);
         this.value = uint(param1.value);
         this.proxyId = uint(param1.proxyId);
         this.stabbingCount = uint(param1.stabbingCount);
         param1.value = _loc2_;
         param1.proxyId = _loc3_;
         param1.stabbingCount = _loc4_;
      
}
IsLower() {
         return (this.value & 1) == 0;
      
}
IsUpper() {
         return (this.value & 1) == 1;
      
}
}
class b2BoundValues {
lowerValues = [0,0];
upperValues = [0,0];
constructor() {
         
      
}
}
class b2BroadPhase {
static s_validate;
static b2_invalid;
static b2_nullEdge;
m_quantizationFactor = new b2Vec2();
m_worldAABB = null;
m_bounds = new Array(2 * b2Settings.b2_maxProxies);
m_freeProxy = 0;
m_proxyCount = 0;
m_proxyPool = new Array(b2Settings.b2_maxPairs);
m_queryResultCount = 0;
m_pairManager = new b2PairManager();
m_timeStamp = 0;
m_queryResults = new Array(b2Settings.b2_maxProxies);
constructor(param1, param2) {
         var _loc3_ = 0;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = null;
         var _loc7_ = 0;
         
         this.m_pairManager.Initialize(this,param2);
         this.m_worldAABB = param1;
         this.m_proxyCount = int(0);
         _loc3_ = int(0);
         while(_loc3_ < b2Settings.b2_maxProxies)
         {
            this.m_queryResults[_loc3_] = 0;
            _loc3_++;
         }
         this.m_bounds = new Array(2);
         _loc3_ = int(0);
         while(_loc3_ < 2)
         {
            this.m_bounds[_loc3_] = new Array(2 * b2Settings.b2_maxProxies);
            _loc7_ = int(0);
            while(_loc7_ < 2 * b2Settings.b2_maxProxies)
            {
               this.m_bounds[_loc3_][_loc7_] = new b2Bound();
               _loc7_++;
            }
            _loc3_++;
         }
         _loc4_ = param1.upperBound.x - param1.lowerBound.x;
         _loc5_ = param1.upperBound.y - param1.lowerBound.y;
         this.m_quantizationFactor.x = b2Settings.USHRT_MAX / _loc4_;
         this.m_quantizationFactor.y = b2Settings.USHRT_MAX / _loc5_;
         _loc3_ = int(0);
         while(_loc3_ < b2Settings.b2_maxProxies - 1)
         {
            _loc6_ = new b2Proxy();
            this.m_proxyPool[_loc3_] = _loc6_;
            _loc6_.SetNext(_loc3_ + 1);
            _loc6_.timeStamp = 0;
            _loc6_.overlapCount = b2BroadPhase.b2_invalid;
            _loc6_.userData = null;
            _loc3_++;
         }
         _loc6_ = new b2Proxy();
         this.m_proxyPool[int(b2Settings.b2_maxProxies - 1)] = _loc6_;
         _loc6_.SetNext(b2Pair.b2_nullProxy);
         _loc6_.timeStamp = 0;
         _loc6_.overlapCount = b2BroadPhase.b2_invalid;
         _loc6_.userData = null;
         this.m_freeProxy = uint(0);
         this.m_timeStamp = uint(1);
         this.m_queryResultCount = int(0);
      
}
static BinarySearch(param1, param2, param3) {param2=int(param2);param3=uint(param3);
         var _loc4_ = 0;
         var _loc5_ = 0;
         var _loc6_ = 0;
         var _loc7_ = null;
         _loc4_ = int(0);
         _loc5_ = int(param2 - 1);
         while(_loc4_ <= _loc5_)
         {
            _loc6_ = int((_loc4_ + _loc5_) / 2);
            _loc7_ = param1[_loc6_];
            if(_loc7_.value > param3)
            {
               _loc5_ = int(_loc6_ - 1);
            }
            else
            {
               if(_loc7_.value >= param3)
               {
                  return uint(_loc6_);
               }
               _loc4_ = int(_loc6_ + 1);
            }
         }
         return uint(_loc4_);
      
}
QueryAABB(param1, param2, param3) {param3=int(param3);
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc8_ = null;
         var _loc9_ = null;
         var _loc10_ = 0;
         var _loc11_ = 0;
         var _loc12_ = null;
         _loc4_ = new Array();
         _loc5_ = new Array();
         this.ComputeBounds(_loc4_,_loc5_,param1);
         _loc8_ = [0];
         _loc9_ = [0];
         this.Query(_loc8_,_loc9_,_loc4_[0],_loc5_[0],this.m_bounds[0],2 * this.m_proxyCount,0);
         this.Query(_loc8_,_loc9_,_loc4_[1],_loc5_[1],this.m_bounds[1],2 * this.m_proxyCount,1);
         _loc10_ = int(0);
         _loc11_ = int(0);
         while(_loc11_ < this.m_queryResultCount && _loc10_ < param3)
         {
            _loc12_ = this.m_proxyPool[this.m_queryResults[_loc11_]];
            param2[_loc11_] = _loc12_.userData;
            _loc11_++;
            _loc10_++;
         }
         this.m_queryResultCount = int(0);
         this.IncrementTimeStamp();
         return _loc10_;
      
}
Commit() {
         this.m_pairManager.Commit();
      
}
GetProxy(param1) {param1=int(param1);
         var _loc2_ = null;
         _loc2_ = this.m_proxyPool[param1];
         if(param1 == b2Pair.b2_nullProxy || _loc2_.IsValid() == false)
         {
            return null;
         }
         return _loc2_;
      
}
IncrementTimeStamp() {
         var _loc1_ = 0;
         if(this.m_timeStamp == b2Settings.USHRT_MAX)
         {
            _loc1_ = uint(0);
            while(_loc1_ < b2Settings.b2_maxProxies)
            {
               (this.m_proxyPool[_loc1_]).timeStamp = 0;
               _loc1_++;
            }
            this.m_timeStamp = uint(1);
         }
         else
         {
            ++this.m_timeStamp;
         }
      
}
Query(param1, param2, param3, param4, param5, param6, param7) {param3=uint(param3);param4=uint(param4);param6=uint(param6);param7=int(param7);
         var _loc8_ = 0;
         var _loc9_ = 0;
         var _loc10_ = null;
         var _loc11_ = 0;
         var _loc12_ = 0;
         var _loc13_ = 0;
         var _loc14_ = null;
         _loc8_ = uint(b2BroadPhase.BinarySearch(param5,param6,param3));
         _loc9_ = uint(b2BroadPhase.BinarySearch(param5,param6,param4));
         _loc11_ = uint(_loc8_);
         while(_loc11_ < _loc9_)
         {
            _loc10_ = param5[_loc11_];
            if(_loc10_.IsLower())
            {
               this.IncrementOverlapCount(_loc10_.proxyId);
            }
            _loc11_++;
         }
         if(_loc8_ > 0)
         {
            _loc12_ = int(_loc8_ - 1);
            _loc10_ = param5[_loc12_];
            _loc13_ = int(_loc10_.stabbingCount);
            while(_loc13_)
            {
               _loc10_ = param5[_loc12_];
               if(_loc10_.IsLower())
               {
                  _loc14_ = this.m_proxyPool[_loc10_.proxyId];
                  if(_loc8_ <= _loc14_.upperBounds[param7])
                  {
                     this.IncrementOverlapCount(_loc10_.proxyId);
                     _loc13_--;
                  }
               }
               _loc12_--;
            }
         }
         param1[0] = _loc8_;
         param2[0] = _loc9_;
      
}
TestOverlapValidate(param1, param2) {
         var _loc3_ = 0;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = null;
         _loc3_ = int(0);
         while(_loc3_ < 2)
         {
            _loc4_ = this.m_bounds[_loc3_];
            _loc5_ = _loc4_[param1.lowerBounds[_loc3_]];
            _loc6_ = _loc4_[param2.upperBounds[_loc3_]];
            if(_loc5_.value > _loc6_.value)
            {
               return false;
            }
            _loc5_ = _loc4_[param1.upperBounds[_loc3_]];
            _loc6_ = _loc4_[param2.lowerBounds[_loc3_]];
            if(_loc5_.value < _loc6_.value)
            {
               return false;
            }
            _loc3_++;
         }
         return true;
      
}
ComputeBounds(param1, param2, param3) {
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         _loc4_ = param3.lowerBound.x;
         _loc5_ = param3.lowerBound.y;
         _loc4_ = b2Math.b2Min(_loc4_,this.m_worldAABB.upperBound.x);
         _loc5_ = b2Math.b2Min(_loc5_,this.m_worldAABB.upperBound.y);
         _loc4_ = b2Math.b2Max(_loc4_,this.m_worldAABB.lowerBound.x);
         _loc5_ = b2Math.b2Max(_loc5_,this.m_worldAABB.lowerBound.y);
         _loc6_ = param3.upperBound.x;
         _loc7_ = param3.upperBound.y;
         _loc6_ = b2Math.b2Min(_loc6_,this.m_worldAABB.upperBound.x);
         _loc7_ = b2Math.b2Min(_loc7_,this.m_worldAABB.upperBound.y);
         _loc6_ = b2Math.b2Max(_loc6_,this.m_worldAABB.lowerBound.x);
         _loc7_ = b2Math.b2Max(_loc7_,this.m_worldAABB.lowerBound.y);
         param1[0] = uint(this.m_quantizationFactor.x * (_loc4_ - this.m_worldAABB.lowerBound.x)) & b2Settings.USHRT_MAX - 1;
         param2[0] = uint(this.m_quantizationFactor.x * (_loc6_ - this.m_worldAABB.lowerBound.x)) & 0xFFFF | 1;
         param1[1] = uint(this.m_quantizationFactor.y * (_loc5_ - this.m_worldAABB.lowerBound.y)) & b2Settings.USHRT_MAX - 1;
         param2[1] = uint(this.m_quantizationFactor.y * (_loc7_ - this.m_worldAABB.lowerBound.y)) & 0xFFFF | 1;
      
}
CreateProxy(param1, param2) {
         var _loc3_ = 0;
         var _loc4_ = null;
         var _loc5_ = 0;
         var _loc6_ = 0;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = 0;
         var _loc10_ = 0;
         var _loc11_ = null;
         var _loc12_ = 0;
         var _loc13_ = 0;
         var _loc14_ = null;
         var _loc15_ = null;
         var _loc16_ = null;
         var _loc17_ = 0;
         var _loc18_ = 0;
         var _loc19_ = null;
         var _loc20_ = null;
         var _loc21_ = null;
         var _loc22_ = 0;
         var _loc23_ = null;
         _loc5_ = uint(this.m_freeProxy);
         _loc4_ = this.m_proxyPool[_loc5_];
         this.m_freeProxy = uint(_loc4_.GetNext());
         _loc4_.overlapCount = 0;
         _loc4_.userData = param2;
         _loc6_ = uint(2 * this.m_proxyCount);
         _loc7_ = new Array();
         _loc8_ = new Array();
         this.ComputeBounds(_loc7_,_loc8_,param1);
         _loc9_ = int(0);
         while(_loc9_ < 2)
         {
            _loc11_ = this.m_bounds[_loc9_];
            _loc14_ = [_loc12_];
            _loc15_ = [_loc13_];
            this.Query(_loc14_,_loc15_,_loc7_[_loc9_],_loc8_[_loc9_],_loc11_,_loc6_,_loc9_);
            _loc12_ = uint(uint(_loc14_[0]));
            _loc13_ = uint(uint(_loc15_[0]));
            _loc16_ = new Array();
            _loc18_ = int(_loc6_ - _loc13_);
            _loc17_ = int(0);
            while(_loc17_ < _loc18_)
            {
               _loc16_[_loc17_] = new b2Bound();
               _loc19_ = _loc16_[_loc17_];
               _loc20_ = _loc11_[int(_loc13_ + _loc17_)];
               _loc19_.value = _loc20_.value;
               _loc19_.proxyId = _loc20_.proxyId;
               _loc19_.stabbingCount = _loc20_.stabbingCount;
               _loc17_++;
            }
            _loc18_ = int(int(_loc16_.length));
            _loc22_ = int(_loc13_ + 2);
            _loc17_ = int(0);
            while(_loc17_ < _loc18_)
            {
               _loc20_ = _loc16_[_loc17_];
               _loc19_ = _loc11_[int(_loc22_ + _loc17_)];
               _loc19_.value = _loc20_.value;
               _loc19_.proxyId = _loc20_.proxyId;
               _loc19_.stabbingCount = _loc20_.stabbingCount;
               _loc17_++;
            }
            _loc16_ = new Array();
            _loc18_ = int(_loc13_ - _loc12_);
            _loc17_ = int(0);
            while(_loc17_ < _loc18_)
            {
               _loc16_[_loc17_] = new b2Bound();
               _loc19_ = _loc16_[_loc17_];
               _loc20_ = _loc11_[int(_loc12_ + _loc17_)];
               _loc19_.value = _loc20_.value;
               _loc19_.proxyId = _loc20_.proxyId;
               _loc19_.stabbingCount = _loc20_.stabbingCount;
               _loc17_++;
            }
            _loc18_ = int(int(_loc16_.length));
            _loc22_ = int(_loc12_ + 1);
            _loc17_ = int(0);
            while(_loc17_ < _loc18_)
            {
               _loc20_ = _loc16_[_loc17_];
               _loc19_ = _loc11_[int(_loc22_ + _loc17_)];
               _loc19_.value = _loc20_.value;
               _loc19_.proxyId = _loc20_.proxyId;
               _loc19_.stabbingCount = _loc20_.stabbingCount;
               _loc17_++;
            }
            _loc13_++;
            _loc19_ = _loc11_[_loc12_];
            _loc20_ = _loc11_[_loc13_];
            _loc19_.value = _loc7_[_loc9_];
            _loc19_.proxyId = _loc5_;
            _loc20_.value = _loc8_[_loc9_];
            _loc20_.proxyId = _loc5_;
            _loc21_ = _loc11_[int(_loc12_ - 1)];
            _loc19_.stabbingCount = _loc12_ == 0 ? 0 : _loc21_.stabbingCount;
            _loc21_ = _loc11_[int(_loc13_ - 1)];
            _loc20_.stabbingCount = _loc21_.stabbingCount;
            _loc3_ = uint(_loc12_);
            while(_loc3_ < _loc13_)
            {
               _loc21_ = _loc11_[_loc3_];
               ++_loc21_.stabbingCount;
               _loc3_++;
            }
            _loc3_ = uint(_loc12_);
            while(_loc3_ < _loc6_ + 2)
            {
               _loc19_ = _loc11_[_loc3_];
               _loc23_ = this.m_proxyPool[_loc19_.proxyId];
               if(_loc19_.IsLower())
               {
                  _loc23_.lowerBounds[_loc9_] = _loc3_;
               }
               else
               {
                  _loc23_.upperBounds[_loc9_] = _loc3_;
               }
               _loc3_++;
            }
            _loc9_++;
         }
         ++this.m_proxyCount;
         _loc10_ = int(0);
         while(_loc10_ < this.m_queryResultCount)
         {
            this.m_pairManager.AddBufferedPair(_loc5_,this.m_queryResults[_loc10_]);
            _loc10_++;
         }
         this.m_pairManager.Commit();
         this.m_queryResultCount = int(0);
         this.IncrementTimeStamp();
         return _loc5_;
      
}
DestroyProxy(param1) {param1=uint(param1);
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = 0;
         var _loc6_ = 0;
         var _loc7_ = 0;
         var _loc8_ = null;
         var _loc9_ = 0;
         var _loc10_ = 0;
         var _loc11_ = 0;
         var _loc12_ = 0;
         var _loc13_ = null;
         var _loc14_ = 0;
         var _loc15_ = 0;
         var _loc16_ = 0;
         var _loc17_ = 0;
         var _loc18_ = 0;
         var _loc19_ = null;
         _loc4_ = this.m_proxyPool[param1];
         _loc5_ = int(2 * this.m_proxyCount);
         _loc6_ = int(0);
         while(_loc6_ < 2)
         {
            _loc8_ = this.m_bounds[_loc6_];
            _loc9_ = uint(uint(_loc4_.lowerBounds[_loc6_]));
            _loc10_ = uint(uint(_loc4_.upperBounds[_loc6_]));
            _loc2_ = _loc8_[_loc9_];
            _loc11_ = uint(_loc2_.value);
            _loc3_ = _loc8_[_loc10_];
            _loc12_ = uint(_loc3_.value);
            _loc13_ = new Array();
            _loc15_ = int(_loc10_ - _loc9_ - 1);
            _loc14_ = int(0);
            while(_loc14_ < _loc15_)
            {
               _loc13_[_loc14_] = new b2Bound();
               _loc2_ = _loc13_[_loc14_];
               _loc3_ = _loc8_[int(_loc9_ + 1 + _loc14_)];
               _loc2_.value = _loc3_.value;
               _loc2_.proxyId = _loc3_.proxyId;
               _loc2_.stabbingCount = _loc3_.stabbingCount;
               _loc14_++;
            }
            _loc15_ = int(int(_loc13_.length));
            _loc16_ = int(int(_loc9_));
            _loc14_ = int(0);
            while(_loc14_ < _loc15_)
            {
               _loc3_ = _loc13_[_loc14_];
               _loc2_ = _loc8_[int(_loc16_ + _loc14_)];
               _loc2_.value = _loc3_.value;
               _loc2_.proxyId = _loc3_.proxyId;
               _loc2_.stabbingCount = _loc3_.stabbingCount;
               _loc14_++;
            }
            _loc13_ = new Array();
            _loc15_ = int(_loc5_ - _loc10_ - 1);
            _loc14_ = int(0);
            while(_loc14_ < _loc15_)
            {
               _loc13_[_loc14_] = new b2Bound();
               _loc2_ = _loc13_[_loc14_];
               _loc3_ = _loc8_[int(_loc10_ + 1 + _loc14_)];
               _loc2_.value = _loc3_.value;
               _loc2_.proxyId = _loc3_.proxyId;
               _loc2_.stabbingCount = _loc3_.stabbingCount;
               _loc14_++;
            }
            _loc15_ = int(int(_loc13_.length));
            _loc16_ = int(_loc10_ - 1);
            _loc14_ = int(0);
            while(_loc14_ < _loc15_)
            {
               _loc3_ = _loc13_[_loc14_];
               _loc2_ = _loc8_[int(_loc16_ + _loc14_)];
               _loc2_.value = _loc3_.value;
               _loc2_.proxyId = _loc3_.proxyId;
               _loc2_.stabbingCount = _loc3_.stabbingCount;
               _loc14_++;
            }
            _loc15_ = int(_loc5_ - 2);
            _loc17_ = uint(_loc9_);
            while(_loc17_ < _loc15_)
            {
               _loc2_ = _loc8_[_loc17_];
               _loc19_ = this.m_proxyPool[_loc2_.proxyId];
               if(_loc2_.IsLower())
               {
                  _loc19_.lowerBounds[_loc6_] = _loc17_;
               }
               else
               {
                  _loc19_.upperBounds[_loc6_] = _loc17_;
               }
               _loc17_++;
            }
            _loc15_ = int(_loc10_ - 1);
            _loc18_ = int(int(_loc9_));
            while(_loc18_ < _loc15_)
            {
               _loc2_ = _loc8_[_loc18_];
               --_loc2_.stabbingCount;
               _loc18_++;
            }
            this.Query([0],[0],_loc11_,_loc12_,_loc8_,_loc5_ - 2,_loc6_);
            _loc6_++;
         }
         _loc7_ = int(0);
         while(_loc7_ < this.m_queryResultCount)
         {
            this.m_pairManager.RemoveBufferedPair(param1,this.m_queryResults[_loc7_]);
            _loc7_++;
         }
         this.m_pairManager.Commit();
         this.m_queryResultCount = int(0);
         this.IncrementTimeStamp();
         _loc4_.userData = null;
         _loc4_.overlapCount = b2BroadPhase.b2_invalid;
         _loc4_.lowerBounds[0] = b2BroadPhase.b2_invalid;
         _loc4_.lowerBounds[1] = b2BroadPhase.b2_invalid;
         _loc4_.upperBounds[0] = b2BroadPhase.b2_invalid;
         _loc4_.upperBounds[1] = b2BroadPhase.b2_invalid;
         _loc4_.SetNext(this.m_freeProxy);
         this.m_freeProxy = uint(param1);
         --this.m_proxyCount;
      
}
TestOverlap(param1, param2) {
         var _loc3_ = 0;
         var _loc4_ = null;
         var _loc5_ = null;
         _loc3_ = int(0);
         while(_loc3_ < 2)
         {
            _loc4_ = this.m_bounds[_loc3_];
            _loc5_ = _loc4_[param2.upperBounds[_loc3_]];
            if(param1.lowerValues[_loc3_] > _loc5_.value)
            {
               return false;
            }
            _loc5_ = _loc4_[param2.lowerBounds[_loc3_]];
            if(param1.upperValues[_loc3_] < _loc5_.value)
            {
               return false;
            }
            _loc3_++;
         }
         return true;
      
}
Validate() {
         var _loc5_ = 0;
         var _loc6_ = null;
         var _loc7_ = 0;
         var _loc8_ = 0;
         var _loc9_ = 0;
         var _loc10_ = null;
         _loc5_ = int(0);
         while(_loc5_ < 2)
         {
            _loc6_ = this.m_bounds[_loc5_];
            _loc7_ = uint(2 * this.m_proxyCount);
            _loc8_ = uint(0);
            _loc9_ = uint(0);
            while(_loc9_ < _loc7_)
            {
               _loc10_ = _loc6_[_loc9_];
               if(_loc10_.IsLower() == true)
               {
                  _loc8_++;
               }
               else
               {
                  _loc8_--;
               }
               _loc9_++;
            }
            _loc5_++;
         }
      
}
IncrementOverlapCount(param1) {param1=uint(param1);
         var _loc2_ = null;
         _loc2_ = this.m_proxyPool[param1];
         if(_loc2_.timeStamp < this.m_timeStamp)
         {
            _loc2_.timeStamp = this.m_timeStamp;
            _loc2_.overlapCount = 1;
         }
         else
         {
            _loc2_.overlapCount = 2;
            this.m_queryResults[this.m_queryResultCount] = param1;
            ++this.m_queryResultCount;
         }
      
}
InRange(param1) {
         var _loc2_ = NaN;
         var _loc3_ = NaN;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         _loc2_ = param1.lowerBound.x;
         _loc3_ = param1.lowerBound.y;
         _loc2_ -= this.m_worldAABB.upperBound.x;
         _loc3_ -= this.m_worldAABB.upperBound.y;
         _loc4_ = this.m_worldAABB.lowerBound.x;
         _loc5_ = this.m_worldAABB.lowerBound.y;
         _loc4_ -= param1.upperBound.x;
         _loc5_ -= param1.upperBound.y;
         _loc2_ = b2Math.b2Max(_loc2_,_loc4_);
         _loc3_ = b2Math.b2Max(_loc3_,_loc5_);
         return b2Math.b2Max(_loc2_,_loc3_) < 0;
      
}
MoveProxy(param1, param2) {param1=uint(param1);
         var _loc3_ = null;
         var _loc4_ = 0;
         var _loc5_ = 0;
         var _loc6_ = 0;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = null;
         var _loc10_ = 0;
         var _loc11_ = null;
         var _loc12_ = 0;
         var _loc13_ = null;
         var _loc14_ = null;
         var _loc15_ = null;
         var _loc16_ = null;
         var _loc17_ = 0;
         var _loc18_ = 0;
         var _loc19_ = 0;
         var _loc20_ = 0;
         var _loc21_ = 0;
         var _loc22_ = 0;
         var _loc23_ = 0;
         var _loc24_ = null;
         if(param1 == b2Pair.b2_nullProxy || b2Settings.b2_maxProxies <= param1)
         {
            return;
         }
         if(param2.IsValid() == false)
         {
            return;
         }
         _loc12_ = uint(2 * this.m_proxyCount);
         _loc13_ = this.m_proxyPool[param1];
         _loc14_ = new b2BoundValues();
         this.ComputeBounds(_loc14_.lowerValues,_loc14_.upperValues,param2);
         _loc15_ = new b2BoundValues();
         _loc5_ = uint(0);
         while(_loc5_ < 2)
         {
            _loc7_ = this.m_bounds[_loc5_][_loc13_.lowerBounds[_loc5_]];
            _loc15_.lowerValues[_loc5_] = _loc7_.value;
            _loc7_ = this.m_bounds[_loc5_][_loc13_.upperBounds[_loc5_]];
            _loc15_.upperValues[_loc5_] = _loc7_.value;
            _loc5_++;
         }
         _loc5_ = uint(0);
         while(_loc5_ < 2)
         {
            _loc16_ = this.m_bounds[_loc5_];
            _loc17_ = uint(uint(_loc13_.lowerBounds[_loc5_]));
            _loc18_ = uint(uint(_loc13_.upperBounds[_loc5_]));
            _loc19_ = uint(uint(_loc14_.lowerValues[_loc5_]));
            _loc20_ = uint(uint(_loc14_.upperValues[_loc5_]));
            _loc7_ = _loc16_[_loc17_];
            _loc21_ = int(_loc19_ - _loc7_.value);
            _loc7_.value = _loc19_;
            _loc7_ = _loc16_[_loc18_];
            _loc22_ = int(_loc20_ - _loc7_.value);
            _loc7_.value = _loc20_;
            if(_loc21_ < 0)
            {
               _loc6_ = uint(_loc17_);
               while(_loc6_ > 0 && _loc19_ < (_loc16_[int(_loc6_ - 1)]).value)
               {
                  _loc7_ = _loc16_[_loc6_];
                  _loc8_ = _loc16_[int(_loc6_ - 1)];
                  _loc23_ = uint(_loc8_.proxyId);
                  _loc24_ = this.m_proxyPool[_loc8_.proxyId];
                  ++_loc8_.stabbingCount;
                  if(_loc8_.IsUpper() == true)
                  {
                     if(this.TestOverlap(_loc14_,_loc24_))
                     {
                        this.m_pairManager.AddBufferedPair(param1,_loc23_);
                     }
                     _loc3_ = _loc24_.upperBounds;
                     _loc4_ = int(_loc3_[_loc5_]);
                     _loc4_ = _loc4_ + 1;
                     _loc3_[_loc5_] = _loc4_;
                     ++_loc7_.stabbingCount;
                  }
                  else
                  {
                     _loc3_ = _loc24_.lowerBounds;
                     _loc4_ = int(_loc3_[_loc5_]);
                     _loc4_ = _loc4_ + 1;
                     _loc3_[_loc5_] = _loc4_;
                     --_loc7_.stabbingCount;
                  }
                  _loc3_ = _loc13_.lowerBounds;
                  _loc4_ = int(_loc3_[_loc5_]);
                  _loc4_ = _loc4_ - 1;
                  _loc3_[_loc5_] = _loc4_;
                  _loc7_.Swap(_loc8_);
                  _loc6_--;
               }
            }
            if(_loc22_ > 0)
            {
               _loc6_ = uint(_loc18_);
               while(_loc6_ < _loc12_ - 1 && (_loc16_[int(_loc6_ + 1)]).value <= _loc20_)
               {
                  _loc7_ = _loc16_[_loc6_];
                  _loc9_ = _loc16_[int(_loc6_ + 1)];
                  _loc10_ = uint(_loc9_.proxyId);
                  _loc11_ = this.m_proxyPool[_loc10_];
                  ++_loc9_.stabbingCount;
                  if(_loc9_.IsLower() == true)
                  {
                     if(this.TestOverlap(_loc14_,_loc11_))
                     {
                        this.m_pairManager.AddBufferedPair(param1,_loc10_);
                     }
                     _loc3_ = _loc11_.lowerBounds;
                     _loc4_ = int(_loc3_[_loc5_]);
                     _loc4_ = _loc4_ - 1;
                     _loc3_[_loc5_] = _loc4_;
                     ++_loc7_.stabbingCount;
                  }
                  else
                  {
                     _loc3_ = _loc11_.upperBounds;
                     _loc4_ = int(_loc3_[_loc5_]);
                     _loc4_ = _loc4_ - 1;
                     _loc3_[_loc5_] = _loc4_;
                     --_loc7_.stabbingCount;
                  }
                  _loc3_ = _loc13_.upperBounds;
                  _loc4_ = int(_loc3_[_loc5_]);
                  _loc4_ = _loc4_ + 1;
                  _loc3_[_loc5_] = _loc4_;
                  _loc7_.Swap(_loc9_);
                  _loc6_++;
               }
            }
            if(_loc21_ > 0)
            {
               _loc6_ = uint(_loc17_);
               while(_loc6_ < _loc12_ - 1 && (_loc16_[int(_loc6_ + 1)]).value <= _loc19_)
               {
                  _loc7_ = _loc16_[_loc6_];
                  _loc9_ = _loc16_[int(_loc6_ + 1)];
                  _loc10_ = uint(_loc9_.proxyId);
                  _loc11_ = this.m_proxyPool[_loc10_];
                  --_loc9_.stabbingCount;
                  if(_loc9_.IsUpper())
                  {
                     if(this.TestOverlap(_loc15_,_loc11_))
                     {
                        this.m_pairManager.RemoveBufferedPair(param1,_loc10_);
                     }
                     _loc3_ = _loc11_.upperBounds;
                     _loc4_ = int(_loc3_[_loc5_]);
                     _loc4_ = _loc4_ - 1;
                     _loc3_[_loc5_] = _loc4_;
                     --_loc7_.stabbingCount;
                  }
                  else
                  {
                     _loc3_ = _loc11_.lowerBounds;
                     _loc4_ = int(_loc3_[_loc5_]);
                     _loc4_ = _loc4_ - 1;
                     _loc3_[_loc5_] = _loc4_;
                     ++_loc7_.stabbingCount;
                  }
                  _loc3_ = _loc13_.lowerBounds;
                  _loc4_ = int(_loc3_[_loc5_]);
                  _loc4_ = _loc4_ + 1;
                  _loc3_[_loc5_] = _loc4_;
                  _loc7_.Swap(_loc9_);
                  _loc6_++;
               }
            }
            if(_loc22_ < 0)
            {
               _loc6_ = uint(_loc18_);
               while(_loc6_ > 0 && _loc20_ < (_loc16_[int(_loc6_ - 1)]).value)
               {
                  _loc7_ = _loc16_[_loc6_];
                  _loc8_ = _loc16_[int(_loc6_ - 1)];
                  _loc23_ = uint(_loc8_.proxyId);
                  _loc24_ = this.m_proxyPool[_loc23_];
                  --_loc8_.stabbingCount;
                  if(_loc8_.IsLower() == true)
                  {
                     if(this.TestOverlap(_loc15_,_loc24_))
                     {
                        this.m_pairManager.RemoveBufferedPair(param1,_loc23_);
                     }
                     _loc3_ = _loc24_.lowerBounds;
                     _loc4_ = int(_loc3_[_loc5_]);
                     _loc4_ = _loc4_ + 1;
                     _loc3_[_loc5_] = _loc4_;
                     --_loc7_.stabbingCount;
                  }
                  else
                  {
                     _loc3_ = _loc24_.upperBounds;
                     _loc4_ = int(_loc3_[_loc5_]);
                     _loc4_ = _loc4_ + 1;
                     _loc3_[_loc5_] = _loc4_;
                     ++_loc7_.stabbingCount;
                  }
                  _loc3_ = _loc13_.upperBounds;
                  _loc4_ = int(_loc3_[_loc5_]);
                  _loc4_ = _loc4_ - 1;
                  _loc3_[_loc5_] = _loc4_;
                  _loc7_.Swap(_loc8_);
                  _loc6_--;
               }
            }
            _loc5_++;
         }
      
}
}
class b2BufferedPair {
proxyId1 = 0;
proxyId2 = 0;
constructor() {
         
      
}
}
class b2Collision {
static b2_nullFeature;
static b2CollidePolyTempVec;
constructor() {
         
      
}
static EdgeSeparation(param1, param2, param3, param4, param5) {param3=int(param3);
         var _loc6_ = 0;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = 0;
         var _loc10_ = null;
         var _loc11_ = null;
         var _loc12_ = null;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = 0;
         var _loc18_ = NaN;
         var _loc19_ = 0;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         var _loc22_ = NaN;
         var _loc23_ = NaN;
         var _loc24_ = NaN;
         var _loc25_ = NaN;
         _loc6_ = int(param1.m_vertexCount);
         _loc7_ = param1.m_vertices;
         _loc8_ = param1.m_normals;
         _loc9_ = int(param4.m_vertexCount);
         _loc10_ = param4.m_vertices;
         _loc11_ = param2.R;
         _loc12_ = _loc8_[param3];
         _loc13_ = _loc11_.col1.x * _loc12_.x + _loc11_.col2.x * _loc12_.y;
         _loc14_ = _loc11_.col1.y * _loc12_.x + _loc11_.col2.y * _loc12_.y;
         _loc11_ = param5.R;
         _loc15_ = _loc11_.col1.x * _loc13_ + _loc11_.col1.y * _loc14_;
         _loc16_ = _loc11_.col2.x * _loc13_ + _loc11_.col2.y * _loc14_;
         _loc17_ = int(0);
         _loc18_ = Number.MAX_VALUE;
         _loc19_ = int(0);
         while(_loc19_ < _loc9_)
         {
            _loc12_ = _loc10_[_loc19_];
            _loc25_ = _loc12_.x * _loc15_ + _loc12_.y * _loc16_;
            if(_loc25_ < _loc18_)
            {
               _loc18_ = _loc25_;
               _loc17_ = int(_loc19_);
            }
            _loc19_++;
         }
         _loc12_ = _loc7_[param3];
         _loc11_ = param2.R;
         _loc20_ = param2.position.x + (_loc11_.col1.x * _loc12_.x + _loc11_.col2.x * _loc12_.y);
         _loc21_ = param2.position.y + (_loc11_.col1.y * _loc12_.x + _loc11_.col2.y * _loc12_.y);
         _loc12_ = _loc10_[_loc17_];
         _loc11_ = param5.R;
         _loc22_ = param5.position.x + (_loc11_.col1.x * _loc12_.x + _loc11_.col2.x * _loc12_.y);
         _loc23_ = param5.position.y + (_loc11_.col1.y * _loc12_.x + _loc11_.col2.y * _loc12_.y);
         _loc22_ -= _loc20_;
         _loc23_ -= _loc21_;
         return _loc22_ * _loc13_ + _loc23_ * _loc14_;
      
}
static b2TestOverlap(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         _loc3_ = param2.lowerBound;
         _loc4_ = param1.upperBound;
         _loc5_ = _loc3_.x - _loc4_.x;
         _loc6_ = _loc3_.y - _loc4_.y;
         _loc3_ = param1.lowerBound;
         _loc4_ = param2.upperBound;
         _loc7_ = _loc3_.x - _loc4_.x;
         _loc8_ = _loc3_.y - _loc4_.y;
         if(_loc5_ > 0 || _loc6_ > 0)
         {
            return false;
         }
         if(_loc7_ > 0 || _loc8_ > 0)
         {
            return false;
         }
         return true;
      
}
static FindIncidentEdge(param1, param2, param3, param4, param5, param6) {param4=int(param4);
         var _loc7_ = 0;
         var _loc8_ = null;
         var _loc9_ = 0;
         var _loc10_ = null;
         var _loc11_ = null;
         var _loc12_ = null;
         var _loc13_ = null;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = 0;
         var _loc18_ = NaN;
         var _loc19_ = 0;
         var _loc20_ = null;
         var _loc21_ = 0;
         var _loc22_ = 0;
         var _loc23_ = NaN;
         _loc7_ = int(param2.m_vertexCount);
         _loc8_ = param2.m_normals;
         _loc9_ = int(param5.m_vertexCount);
         _loc10_ = param5.m_vertices;
         _loc11_ = param5.m_normals;
         _loc12_ = param3.R;
         _loc13_ = _loc8_[param4];
         _loc14_ = _loc12_.col1.x * _loc13_.x + _loc12_.col2.x * _loc13_.y;
         _loc15_ = _loc12_.col1.y * _loc13_.x + _loc12_.col2.y * _loc13_.y;
         _loc12_ = param6.R;
         _loc16_ = _loc12_.col1.x * _loc14_ + _loc12_.col1.y * _loc15_;
         _loc15_ = _loc12_.col2.x * _loc14_ + _loc12_.col2.y * _loc15_;
         _loc14_ = _loc16_;
         _loc17_ = int(0);
         _loc18_ = Number.MAX_VALUE;
         _loc19_ = int(0);
         while(_loc19_ < _loc9_)
         {
            _loc13_ = _loc11_[_loc19_];
            _loc23_ = _loc14_ * _loc13_.x + _loc15_ * _loc13_.y;
            if(_loc23_ < _loc18_)
            {
               _loc18_ = _loc23_;
               _loc17_ = int(_loc19_);
            }
            _loc19_++;
         }
         _loc21_ = int(_loc17_);
         _loc22_ = int(_loc21_ + 1 < _loc9_ ? int(_loc21_ + 1) : 0);
         _loc20_ = param1[0];
         _loc13_ = _loc10_[_loc21_];
         _loc12_ = param6.R;
         _loc20_.v.x = param6.position.x + (_loc12_.col1.x * _loc13_.x + _loc12_.col2.x * _loc13_.y);
         _loc20_.v.y = param6.position.y + (_loc12_.col1.y * _loc13_.x + _loc12_.col2.y * _loc13_.y);
         _loc20_.id.features.referenceEdge = param4;
         _loc20_.id.features.incidentEdge = _loc21_;
         _loc20_.id.features.incidentVertex = 0;
         _loc20_ = param1[1];
         _loc13_ = _loc10_[_loc22_];
         _loc12_ = param6.R;
         _loc20_.v.x = param6.position.x + (_loc12_.col1.x * _loc13_.x + _loc12_.col2.x * _loc13_.y);
         _loc20_.v.y = param6.position.y + (_loc12_.col1.y * _loc13_.x + _loc12_.col2.y * _loc13_.y);
         _loc20_.id.features.referenceEdge = param4;
         _loc20_.id.features.incidentEdge = _loc22_;
         _loc20_.id.features.incidentVertex = 1;
      
}
static b2CollidePolygons(param1, param2, param3, param4, param5) {
         var _loc6_ = null;
         var _loc7_ = 0;
         var _loc8_ = null;
         var _loc9_ = NaN;
         var _loc10_ = 0;
         var _loc11_ = null;
         var _loc12_ = NaN;
         var _loc13_ = null;
         var _loc14_ = null;
         var _loc15_ = null;
         var _loc16_ = null;
         var _loc17_ = 0;
         var _loc18_ = 0;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         var _loc21_ = null;
         var _loc22_ = 0;
         var _loc23_ = null;
         var _loc24_ = null;
         var _loc25_ = null;
         var _loc26_ = null;
         var _loc27_ = null;
         var _loc28_ = null;
         var _loc29_ = NaN;
         var _loc30_ = NaN;
         var _loc31_ = NaN;
         var _loc32_ = null;
         var _loc33_ = null;
         var _loc34_ = 0;
         var _loc35_ = 0;
         var _loc36_ = 0;
         var _loc37_ = null;
         var _loc38_ = NaN;
         var _loc39_ = null;
         param1.pointCount = 0;
         _loc7_ = int(0);
         _loc8_ = [_loc7_];
         _loc9_ = b2Collision.FindMaxSeparation(_loc8_,param2,param3,param4,param5);
         _loc7_ = int(int(_loc8_[0]));
         if(_loc9_ > 0)
         {
            return;
         }
         _loc10_ = int(0);
         _loc11_ = [_loc10_];
         _loc12_ = b2Collision.FindMaxSeparation(_loc11_,param4,param5,param2,param3);
         _loc10_ = int(int(_loc11_[0]));
         if(_loc12_ > 0)
         {
            return;
         }
         _loc15_ = new b2XForm();
         _loc16_ = new b2XForm();
         _loc19_ = 0.98;
         _loc20_ = 0.001;
         if(_loc12_ > _loc19_ * _loc9_ + _loc20_)
         {
            _loc13_ = param4;
            _loc14_ = param2;
            _loc15_.Set(param5);
            _loc16_.Set(param3);
            _loc17_ = int(_loc10_);
            _loc18_ = uint(1);
         }
         else
         {
            _loc13_ = param2;
            _loc14_ = param4;
            _loc15_.Set(param3);
            _loc16_.Set(param5);
            _loc17_ = int(_loc7_);
            _loc18_ = uint(0);
         }
         _loc21_ = [new ClipVertex(),new ClipVertex()];
         b2Collision.FindIncidentEdge(_loc21_,_loc13_,_loc15_,_loc17_,_loc14_,_loc16_);
         _loc22_ = int(_loc13_.m_vertexCount);
         _loc23_ = _loc13_.m_vertices;
         _loc24_ = _loc23_[_loc17_];
         _loc25_ = _loc24_.Copy();
         if(_loc17_ + 1 < _loc22_)
         {
            _loc24_ = _loc23_[int(_loc17_ + 1)];
            _loc37_ = _loc24_.Copy();
         }
         else
         {
            _loc24_ = _loc23_[0];
            _loc37_ = _loc24_.Copy();
         }
         _loc26_ = b2Math.SubtractVV(_loc37_,_loc25_);
         _loc27_ = b2Math.b2MulMV(_loc15_.R,b2Math.SubtractVV(_loc37_,_loc25_));
         _loc27_.Normalize();
         _loc28_ = b2Math.b2CrossVF(_loc27_,1);
         _loc25_ = b2Math.b2MulX(_loc15_,_loc25_);
         _loc37_ = b2Math.b2MulX(_loc15_,_loc37_);
         _loc29_ = b2Math.b2Dot(_loc28_,_loc25_);
         _loc30_ = -b2Math.b2Dot(_loc27_,_loc25_);
         _loc31_ = b2Math.b2Dot(_loc27_,_loc37_);
         _loc32_ = [new ClipVertex(),new ClipVertex()];
         _loc33_ = [new ClipVertex(),new ClipVertex()];
         _loc34_ = int(b2Collision.ClipSegmentToLine(_loc32_,_loc21_,_loc27_.Negative(),_loc30_));
         if(_loc34_ < 2)
         {
            return;
         }
         _loc34_ = int(b2Collision.ClipSegmentToLine(_loc33_,_loc32_,_loc27_,_loc31_));
         if(_loc34_ < 2)
         {
            return;
         }
         param1.normal = _loc18_ ? _loc28_.Negative() : _loc28_.Copy();
         _loc35_ = int(0);
         _loc36_ = int(0);
         while(_loc36_ < b2Settings.b2_maxManifoldPoints)
         {
            _loc6_ = _loc33_[_loc36_];
            _loc38_ = b2Math.b2Dot(_loc28_,_loc6_.v) - _loc29_;
            if(_loc38_ <= 0)
            {
               _loc39_ = param1.points[_loc35_];
               _loc39_.separation = _loc38_;
               _loc39_.localPoint1 = b2Math.b2MulXT(param3,_loc6_.v);
               _loc39_.localPoint2 = b2Math.b2MulXT(param5,_loc6_.v);
               _loc39_.id.key = _loc6_.id._key;
               _loc39_.id.features.flip = _loc18_;
               _loc35_++;
            }
            _loc36_++;
         }
         param1.pointCount = _loc35_;
      
}
static FindMaxSeparation(param1, param2, param3, param4, param5) {
         var _loc6_ = 0;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = null;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = 0;
         var _loc15_ = NaN;
         var _loc16_ = 0;
         var _loc17_ = NaN;
         var _loc18_ = 0;
         var _loc19_ = NaN;
         var _loc20_ = 0;
         var _loc21_ = NaN;
         var _loc22_ = 0;
         var _loc23_ = NaN;
         var _loc24_ = 0;
         var _loc25_ = NaN;
         _loc6_ = int(param2.m_vertexCount);
         _loc7_ = param2.m_normals;
         _loc9_ = param5.R;
         _loc8_ = param4.m_centroid;
         _loc10_ = param5.position.x + (_loc9_.col1.x * _loc8_.x + _loc9_.col2.x * _loc8_.y);
         _loc11_ = param5.position.y + (_loc9_.col1.y * _loc8_.x + _loc9_.col2.y * _loc8_.y);
         _loc9_ = param3.R;
         _loc8_ = param2.m_centroid;
         _loc10_ -= param3.position.x + (_loc9_.col1.x * _loc8_.x + _loc9_.col2.x * _loc8_.y);
         _loc11_ -= param3.position.y + (_loc9_.col1.y * _loc8_.x + _loc9_.col2.y * _loc8_.y);
         _loc12_ = _loc10_ * param3.R.col1.x + _loc11_ * param3.R.col1.y;
         _loc13_ = _loc10_ * param3.R.col2.x + _loc11_ * param3.R.col2.y;
         _loc14_ = int(0);
         _loc15_ = -Number.MAX_VALUE;
         _loc16_ = int(0);
         while(_loc16_ < _loc6_)
         {
            _loc8_ = _loc7_[_loc16_];
            _loc25_ = _loc8_.x * _loc12_ + _loc8_.y * _loc13_;
            if(_loc25_ > _loc15_)
            {
               _loc15_ = _loc25_;
               _loc14_ = int(_loc16_);
            }
            _loc16_++;
         }
         _loc17_ = b2Collision.EdgeSeparation(param2,param3,_loc14_,param4,param5);
         if(_loc17_ > 0)
         {
            return _loc17_;
         }
         _loc18_ = int(_loc14_ - 1 >= 0 ? int(_loc14_ - 1) : int(_loc6_ - 1));
         _loc19_ = b2Collision.EdgeSeparation(param2,param3,_loc18_,param4,param5);
         if(_loc19_ > 0)
         {
            return _loc19_;
         }
         _loc20_ = int(_loc14_ + 1 < _loc6_ ? int(_loc14_ + 1) : 0);
         _loc21_ = b2Collision.EdgeSeparation(param2,param3,_loc20_,param4,param5);
         if(_loc21_ > 0)
         {
            return _loc21_;
         }
         if(_loc19_ > _loc17_ && _loc19_ > _loc21_)
         {
            _loc24_ = int(-1);
            _loc22_ = int(_loc18_);
            _loc23_ = _loc19_;
         }
         else
         {
            if(_loc21_ <= _loc17_)
            {
               param1[0] = _loc14_;
               return _loc17_;
            }
            _loc24_ = int(1);
            _loc22_ = int(_loc20_);
            _loc23_ = _loc21_;
         }
         while(true)
         {
            if(_loc24_ == -1)
            {
               _loc14_ = int(_loc22_ - 1 >= 0 ? int(_loc22_ - 1) : int(_loc6_ - 1));
            }
            else
            {
               _loc14_ = int(_loc22_ + 1 < _loc6_ ? int(_loc22_ + 1) : 0);
            }
            _loc17_ = b2Collision.EdgeSeparation(param2,param3,_loc14_,param4,param5);
            if(_loc17_ > 0)
            {
               break;
            }
            if(_loc17_ <= _loc23_)
            {
               param1[0] = _loc22_;
               return _loc23_;
            }
            _loc22_ = int(_loc14_);
            _loc23_ = _loc17_;
         }
         return _loc17_;
      
}
static ClipSegmentToLine(param1, param2, param3, param4) {
         var _loc5_ = null;
         var _loc6_ = 0;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = null;
         var _loc13_ = null;
         _loc6_ = 0;
         _loc5_ = param2[0];
         _loc7_ = _loc5_.v;
         _loc5_ = param2[1];
         _loc8_ = _loc5_.v;
         _loc9_ = b2Math.b2Dot(param3,_loc7_) - param4;
         _loc10_ = b2Math.b2Dot(param3,_loc8_) - param4;
         if(_loc9_ <= 0)
         {
            var _loc14_;
            param1[_loc14_ = _loc6_++] = param2[0];
         }
         if(_loc10_ <= 0)
         {
            param1[_loc14_ = _loc6_++] = param2[1];
         }
         if(_loc9_ * _loc10_ < 0)
         {
            _loc11_ = _loc9_ / (_loc9_ - _loc10_);
            _loc5_ = param1[_loc6_];
            _loc12_ = _loc5_.v;
            _loc12_.x = _loc7_.x + _loc11_ * (_loc8_.x - _loc7_.x);
            _loc12_.y = _loc7_.y + _loc11_ * (_loc8_.y - _loc7_.y);
            _loc5_ = param1[_loc6_];
            if(_loc9_ > 0)
            {
               _loc13_ = param2[0];
               _loc5_.id = _loc13_.id;
            }
            else
            {
               _loc13_ = param2[1];
               _loc5_.id = _loc13_.id;
            }
            _loc6_++;
         }
         return _loc6_;
      
}
static b2CollideCircles(param1, param2, param3, param4, param5) {
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = null;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         var _loc22_ = NaN;
         var _loc23_ = NaN;
         var _loc24_ = NaN;
         var _loc25_ = NaN;
         param1.pointCount = 0;
         _loc6_ = param3.R;
         _loc7_ = param2.m_localPosition;
         _loc8_ = param3.position.x + (_loc6_.col1.x * _loc7_.x + _loc6_.col2.x * _loc7_.y);
         _loc9_ = param3.position.y + (_loc6_.col1.y * _loc7_.x + _loc6_.col2.y * _loc7_.y);
         _loc6_ = param5.R;
         _loc7_ = param4.m_localPosition;
         _loc10_ = param5.position.x + (_loc6_.col1.x * _loc7_.x + _loc6_.col2.x * _loc7_.y);
         _loc11_ = param5.position.y + (_loc6_.col1.y * _loc7_.x + _loc6_.col2.y * _loc7_.y);
         _loc12_ = _loc10_ - _loc8_;
         _loc13_ = _loc11_ - _loc9_;
         _loc14_ = _loc12_ * _loc12_ + _loc13_ * _loc13_;
         _loc15_ = param2.m_radius;
         _loc16_ = param4.m_radius;
         _loc17_ = _loc15_ + _loc16_;
         if(_loc14_ > _loc17_ * _loc17_)
         {
            return;
         }
         if(_loc14_ < Number.MIN_VALUE)
         {
            _loc18_ = -_loc17_;
            param1.normal.Set(0,1);
         }
         else
         {
            _loc24_ = Math.sqrt(_loc14_);
            _loc18_ = _loc24_ - _loc17_;
            _loc25_ = 1 / _loc24_;
            param1.normal.x = _loc25_ * _loc12_;
            param1.normal.y = _loc25_ * _loc13_;
         }
         param1.pointCount = 1;
         _loc19_ = param1.points[0];
         _loc19_.id.key = 0;
         _loc19_.separation = _loc18_;
         _loc8_ += _loc15_ * param1.normal.x;
         _loc9_ += _loc15_ * param1.normal.y;
         _loc10_ -= _loc16_ * param1.normal.x;
         _loc11_ -= _loc16_ * param1.normal.y;
         _loc20_ = 0.5 * (_loc8_ + _loc10_);
         _loc21_ = 0.5 * (_loc9_ + _loc11_);
         _loc22_ = _loc20_ - param3.position.x;
         _loc23_ = _loc21_ - param3.position.y;
         _loc19_.localPoint1.x = _loc22_ * param3.R.col1.x + _loc23_ * param3.R.col1.y;
         _loc19_.localPoint1.y = _loc22_ * param3.R.col2.x + _loc23_ * param3.R.col2.y;
         _loc22_ = _loc20_ - param5.position.x;
         _loc23_ = _loc21_ - param5.position.y;
         _loc19_.localPoint2.x = _loc22_ * param5.R.col1.x + _loc23_ * param5.R.col1.y;
         _loc19_.localPoint2.y = _loc22_ * param5.R.col2.x + _loc23_ * param5.R.col2.y;
      
}
static b2CollidePolygonAndCircle(param1, param2, param3, param4, param5) {
         var _loc6_ = null;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = null;
         var _loc12_ = null;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = 0;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         var _loc21_ = 0;
         var _loc22_ = null;
         var _loc23_ = null;
         var _loc24_ = 0;
         var _loc25_ = 0;
         var _loc26_ = 0;
         var _loc27_ = null;
         var _loc28_ = NaN;
         var _loc29_ = NaN;
         var _loc30_ = NaN;
         var _loc31_ = NaN;
         var _loc32_ = NaN;
         var _loc33_ = NaN;
         var _loc34_ = NaN;
         param1.pointCount = 0;
         _loc12_ = param5.R;
         _loc11_ = param4.m_localPosition;
         _loc13_ = param5.position.x + (_loc12_.col1.x * _loc11_.x + _loc12_.col2.x * _loc11_.y);
         _loc14_ = param5.position.y + (_loc12_.col1.y * _loc11_.x + _loc12_.col2.y * _loc11_.y);
         _loc7_ = _loc13_ - param3.position.x;
         _loc8_ = _loc14_ - param3.position.y;
         _loc12_ = param3.R;
         _loc15_ = _loc7_ * _loc12_.col1.x + _loc8_ * _loc12_.col1.y;
         _loc16_ = _loc7_ * _loc12_.col2.x + _loc8_ * _loc12_.col2.y;
         _loc18_ = int(0);
         _loc19_ = -Number.MAX_VALUE;
         _loc20_ = param4.m_radius;
         _loc21_ = int(param2.m_vertexCount);
         _loc22_ = param2.m_vertices;
         _loc23_ = param2.m_normals;
         _loc24_ = int(0);
         while(_loc24_ < _loc21_)
         {
            _loc11_ = _loc22_[_loc24_];
            _loc7_ = _loc15_ - _loc11_.x;
            _loc8_ = _loc16_ - _loc11_.y;
            _loc11_ = _loc23_[_loc24_];
            _loc34_ = _loc11_.x * _loc7_ + _loc11_.y * _loc8_;
            if(_loc34_ > _loc20_)
            {
               return;
            }
            if(_loc34_ > _loc19_)
            {
               _loc19_ = _loc34_;
               _loc18_ = int(_loc24_);
            }
            _loc24_++;
         }
         if(_loc19_ < Number.MIN_VALUE)
         {
            param1.pointCount = 1;
            _loc11_ = _loc23_[_loc18_];
            _loc12_ = param3.R;
            param1.normal.x = _loc12_.col1.x * _loc11_.x + _loc12_.col2.x * _loc11_.y;
            param1.normal.y = _loc12_.col1.y * _loc11_.x + _loc12_.col2.y * _loc11_.y;
            _loc6_ = param1.points[0];
            _loc6_.id.features.incidentEdge = _loc18_;
            _loc6_.id.features.incidentVertex = b2Collision.b2_nullFeature;
            _loc6_.id.features.referenceEdge = 0;
            _loc6_.id.features.flip = 0;
            _loc9_ = _loc13_ - _loc20_ * param1.normal.x;
            _loc10_ = _loc14_ - _loc20_ * param1.normal.y;
            _loc7_ = _loc9_ - param3.position.x;
            _loc8_ = _loc10_ - param3.position.y;
            _loc12_ = param3.R;
            _loc6_.localPoint1.x = _loc7_ * _loc12_.col1.x + _loc8_ * _loc12_.col1.y;
            _loc6_.localPoint1.y = _loc7_ * _loc12_.col2.x + _loc8_ * _loc12_.col2.y;
            _loc7_ = _loc9_ - param5.position.x;
            _loc8_ = _loc10_ - param5.position.y;
            _loc12_ = param5.R;
            _loc6_.localPoint2.x = _loc7_ * _loc12_.col1.x + _loc8_ * _loc12_.col1.y;
            _loc6_.localPoint2.y = _loc7_ * _loc12_.col2.x + _loc8_ * _loc12_.col2.y;
            _loc6_.separation = _loc19_ - _loc20_;
            return;
         }
         _loc25_ = int(_loc18_);
         _loc26_ = int(_loc25_ + 1 < _loc21_ ? int(_loc25_ + 1) : 0);
         _loc11_ = _loc22_[_loc25_];
         _loc27_ = _loc22_[_loc26_];
         _loc28_ = _loc27_.x - _loc11_.x;
         _loc29_ = _loc27_.y - _loc11_.y;
         _loc30_ = Math.sqrt(_loc28_ * _loc28_ + _loc29_ * _loc29_);
         _loc28_ /= _loc30_;
         _loc29_ /= _loc30_;
         _loc7_ = _loc15_ - _loc11_.x;
         _loc8_ = _loc16_ - _loc11_.y;
         _loc31_ = _loc7_ * _loc28_ + _loc8_ * _loc29_;
         _loc6_ = param1.points[0];
         if(_loc31_ <= 0)
         {
            _loc32_ = _loc11_.x;
            _loc33_ = _loc11_.y;
            _loc6_.id.features.incidentEdge = b2Collision.b2_nullFeature;
            _loc6_.id.features.incidentVertex = _loc25_;
         }
         else if(_loc31_ >= _loc30_)
         {
            _loc32_ = _loc27_.x;
            _loc33_ = _loc27_.y;
            _loc6_.id.features.incidentEdge = b2Collision.b2_nullFeature;
            _loc6_.id.features.incidentVertex = _loc26_;
         }
         else
         {
            _loc32_ = _loc28_ * _loc31_ + _loc11_.x;
            _loc33_ = _loc29_ * _loc31_ + _loc11_.y;
            _loc6_.id.features.incidentEdge = _loc18_;
            _loc6_.id.features.incidentVertex = b2Collision.b2_nullFeature;
         }
         _loc7_ = _loc15_ - _loc32_;
         _loc8_ = _loc16_ - _loc33_;
         _loc17_ = Math.sqrt(_loc7_ * _loc7_ + _loc8_ * _loc8_);
         _loc7_ /= _loc17_;
         _loc8_ /= _loc17_;
         if(_loc17_ > _loc20_)
         {
            return;
         }
         param1.pointCount = 1;
         _loc12_ = param3.R;
         param1.normal.x = _loc12_.col1.x * _loc7_ + _loc12_.col2.x * _loc8_;
         param1.normal.y = _loc12_.col1.y * _loc7_ + _loc12_.col2.y * _loc8_;
         _loc9_ = _loc13_ - _loc20_ * param1.normal.x;
         _loc10_ = _loc14_ - _loc20_ * param1.normal.y;
         _loc7_ = _loc9_ - param3.position.x;
         _loc8_ = _loc10_ - param3.position.y;
         _loc12_ = param3.R;
         _loc6_.localPoint1.x = _loc7_ * _loc12_.col1.x + _loc8_ * _loc12_.col1.y;
         _loc6_.localPoint1.y = _loc7_ * _loc12_.col2.x + _loc8_ * _loc12_.col2.y;
         _loc7_ = _loc9_ - param5.position.x;
         _loc8_ = _loc10_ - param5.position.y;
         _loc12_ = param5.R;
         _loc6_.localPoint2.x = _loc7_ * _loc12_.col1.x + _loc8_ * _loc12_.col1.y;
         _loc6_.localPoint2.y = _loc7_ * _loc12_.col2.x + _loc8_ * _loc12_.col2.y;
         _loc6_.separation = _loc17_ - _loc20_;
         _loc6_.id.features.referenceEdge = 0;
         _loc6_.id.features.flip = 0;
      
}
}
class b2ContactID {
_key = 0;
features = new Features();
constructor() {
         
         this.features._m_id = this;
      
}
Set(param1) {
         this.key = param1._key;
      
}
Copy() {
         var _loc1_ = null;
         _loc1_ = new b2ContactID();
         _loc1_.key = this.key;
         return _loc1_;
      
}
get key() {
         return this._key;
      
}
set key(param1) {param1=uint(param1);
         this._key = uint(param1);
         this.features._referenceEdge = this._key & 0xFF;
         this.features._incidentEdge = (this._key & 0xFF00) >> 8 & 0xFF;
         this.features._incidentVertex = (this._key & 0xFF0000) >> 16 & 0xFF;
         this.features._flip = (this._key & 0xFF000000) >> 24 & 0xFF;
      
}
}
class b2ContactPoint {
separation = NaN;
normal = new b2Vec2();
position = new b2Vec2();
restitution = NaN;
shape1 = null;
shape2 = null;
id = new b2ContactID();
friction = NaN;
velocity = new b2Vec2();
constructor() {
         
      
}
}
class b2Distance {
static s_p1s;
static s_p2s;
static s_points;
static gPoint;
static g_GJK_Iterations;
constructor() {
         
      
}
static InPoints(param1, param2, param3) {param3=int(param3);
         var _loc4_ = NaN;
         var _loc5_ = 0;
         var _loc6_ = null;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         _loc4_ = 100 * Number.MIN_VALUE;
         _loc5_ = int(0);
         while(_loc5_ < param3)
         {
            _loc6_ = param2[_loc5_];
            _loc7_ = Math.abs(param1.x - _loc6_.x);
            _loc8_ = Math.abs(param1.y - _loc6_.y);
            _loc9_ = Math.max(Math.abs(param1.x),Math.abs(_loc6_.x));
            _loc10_ = Math.max(Math.abs(param1.y),Math.abs(_loc6_.y));
            if(_loc7_ < _loc4_ * (_loc9_ + 1) && _loc8_ < _loc4_ * (_loc10_ + 1))
            {
               return true;
            }
            _loc5_++;
         }
         return false;
      
}
static DistanceGeneric(param1, param2, param3, param4, param5, param6) {
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = null;
         var _loc10_ = null;
         var _loc11_ = 0;
         var _loc12_ = NaN;
         var _loc13_ = 0;
         var _loc14_ = 0;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = null;
         var _loc18_ = null;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         var _loc22_ = NaN;
         var _loc23_ = 0;
         _loc8_ = b2Distance.s_p1s;
         _loc9_ = b2Distance.s_p2s;
         _loc10_ = b2Distance.s_points;
         _loc11_ = int(0);
         param1.SetV(param3.GetFirstVertex(param4));
         param2.SetV(param5.GetFirstVertex(param6));
         _loc12_ = 0;
         _loc13_ = int(20);
         _loc14_ = int(0);
         while(_loc14_ < _loc13_)
         {
            _loc15_ = param2.x - param1.x;
            _loc16_ = param2.y - param1.y;
            _loc17_ = param3.Support(param4,_loc15_,_loc16_);
            _loc18_ = param5.Support(param6,-_loc15_,-_loc16_);
            _loc12_ = _loc15_ * _loc15_ + _loc16_ * _loc16_;
            _loc19_ = _loc18_.x - _loc17_.x;
            _loc20_ = _loc18_.y - _loc17_.y;
            _loc21_ = _loc15_ * _loc19_ + _loc16_ * _loc20_;
            if(_loc12_ - _loc21_ <= 0.01 * _loc12_)
            {
               if(_loc11_ == 0)
               {
                  param1.SetV(_loc17_);
                  param2.SetV(_loc18_);
               }
               b2Distance.g_GJK_Iterations = _loc14_;
               return Math.sqrt(_loc12_);
            }
            switch(_loc11_)
            {
               case 0:
                  _loc7_ = _loc8_[0];
                  _loc7_.SetV(_loc17_);
                  _loc7_ = _loc9_[0];
                  _loc7_.SetV(_loc18_);
                  _loc7_ = _loc10_[0];
                  _loc7_.x = _loc19_;
                  _loc7_.y = _loc20_;
                  param1.SetV(_loc8_[0]);
                  param2.SetV(_loc9_[0]);
                  _loc11_++;
                  break;
               case 1:
                  _loc7_ = _loc8_[1];
                  _loc7_.SetV(_loc17_);
                  _loc7_ = _loc9_[1];
                  _loc7_.SetV(_loc18_);
                  _loc7_ = _loc10_[1];
                  _loc7_.x = _loc19_;
                  _loc7_.y = _loc20_;
                  _loc11_ = int(b2Distance.ProcessTwo(param1,param2,_loc8_,_loc9_,_loc10_));
                  break;
               case 2:
                  _loc7_ = _loc8_[2];
                  _loc7_.SetV(_loc17_);
                  _loc7_ = _loc9_[2];
                  _loc7_.SetV(_loc18_);
                  _loc7_ = _loc10_[2];
                  _loc7_.x = _loc19_;
                  _loc7_.y = _loc20_;
                  _loc11_ = int(b2Distance.ProcessThree(param1,param2,_loc8_,_loc9_,_loc10_));
            }
            if(_loc11_ == 3)
            {
               b2Distance.g_GJK_Iterations = _loc14_;
               return 0;
            }
            _loc22_ = -Number.MAX_VALUE;
            _loc23_ = int(0);
            while(_loc23_ < _loc11_)
            {
               _loc7_ = _loc10_[_loc23_];
               _loc22_ = b2Math.b2Max(_loc22_,_loc7_.x * _loc7_.x + _loc7_.y * _loc7_.y);
               _loc23_++;
            }
            if(_loc11_ == 3 || _loc12_ <= 100 * Number.MIN_VALUE * _loc22_)
            {
               b2Distance.g_GJK_Iterations = _loc14_;
               _loc15_ = param2.x - param1.x;
               _loc16_ = param2.y - param1.y;
               _loc12_ = _loc15_ * _loc15_ + _loc16_ * _loc16_;
               return Math.sqrt(_loc12_);
            }
            _loc14_++;
         }
         b2Distance.g_GJK_Iterations = _loc13_;
         return Math.sqrt(_loc12_);
      
}
static DistanceCC(param1, param2, param3, param4, param5, param6) {
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         _loc7_ = param4.R;
         _loc8_ = param3.m_localPosition;
         _loc9_ = param4.position.x + (_loc7_.col1.x * _loc8_.x + _loc7_.col2.x * _loc8_.y);
         _loc10_ = param4.position.y + (_loc7_.col1.y * _loc8_.x + _loc7_.col2.y * _loc8_.y);
         _loc7_ = param6.R;
         _loc8_ = param5.m_localPosition;
         _loc11_ = param6.position.x + (_loc7_.col1.x * _loc8_.x + _loc7_.col2.x * _loc8_.y);
         _loc12_ = param6.position.y + (_loc7_.col1.y * _loc8_.x + _loc7_.col2.y * _loc8_.y);
         _loc13_ = _loc11_ - _loc9_;
         _loc14_ = _loc12_ - _loc10_;
         _loc15_ = _loc13_ * _loc13_ + _loc14_ * _loc14_;
         _loc16_ = param3.m_radius - b2Settings.b2_toiSlop;
         _loc17_ = param5.m_radius - b2Settings.b2_toiSlop;
         _loc18_ = _loc16_ + _loc17_;
         if(_loc15_ > _loc18_ * _loc18_)
         {
            _loc19_ = Math.sqrt(_loc15_);
            _loc13_ /= _loc19_;
            _loc14_ /= _loc19_;
            _loc20_ = _loc19_ - _loc18_;
            param1.x = _loc9_ + _loc16_ * _loc13_;
            param1.y = _loc10_ + _loc16_ * _loc14_;
            param2.x = _loc11_ - _loc17_ * _loc13_;
            param2.y = _loc12_ - _loc17_ * _loc14_;
            return _loc20_;
         }
         if(_loc15_ > Number.MIN_VALUE * Number.MIN_VALUE)
         {
            _loc19_ = Math.sqrt(_loc15_);
            _loc13_ /= _loc19_;
            _loc14_ /= _loc19_;
            param1.x = _loc9_ + _loc16_ * _loc13_;
            param1.y = _loc10_ + _loc16_ * _loc14_;
            param2.x = param1.x;
            param2.y = param1.y;
            return 0;
         }
         param1.x = _loc9_;
         param1.y = _loc10_;
         param2.x = param1.x;
         param2.y = param1.y;
         return 0;
      
}
static ProcessThree(param1, param2, param3, param4, param5) {
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = null;
         var _loc10_ = null;
         var _loc11_ = null;
         var _loc12_ = null;
         var _loc13_ = null;
         var _loc14_ = null;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         var _loc22_ = NaN;
         var _loc23_ = NaN;
         var _loc24_ = NaN;
         var _loc25_ = NaN;
         var _loc26_ = NaN;
         var _loc27_ = NaN;
         var _loc28_ = NaN;
         var _loc29_ = NaN;
         var _loc30_ = NaN;
         var _loc31_ = NaN;
         var _loc32_ = NaN;
         var _loc33_ = NaN;
         var _loc34_ = NaN;
         var _loc35_ = NaN;
         var _loc36_ = NaN;
         var _loc37_ = NaN;
         var _loc38_ = NaN;
         var _loc39_ = NaN;
         var _loc40_ = NaN;
         var _loc41_ = NaN;
         _loc6_ = param5[0];
         _loc7_ = param5[1];
         _loc8_ = param5[2];
         _loc9_ = param3[0];
         _loc10_ = param3[1];
         _loc11_ = param3[2];
         _loc12_ = param4[0];
         _loc13_ = param4[1];
         _loc14_ = param4[2];
         _loc15_ = _loc6_.x;
         _loc16_ = _loc6_.y;
         _loc17_ = _loc7_.x;
         _loc18_ = _loc7_.y;
         _loc19_ = _loc8_.x;
         _loc20_ = _loc8_.y;
         _loc21_ = _loc17_ - _loc15_;
         _loc22_ = _loc18_ - _loc16_;
         _loc23_ = _loc19_ - _loc15_;
         _loc24_ = _loc20_ - _loc16_;
         _loc25_ = _loc19_ - _loc17_;
         _loc26_ = _loc20_ - _loc18_;
         _loc27_ = -(_loc15_ * _loc21_ + _loc16_ * _loc22_);
         _loc28_ = _loc17_ * _loc21_ + _loc18_ * _loc22_;
         _loc29_ = -(_loc15_ * _loc23_ + _loc16_ * _loc24_);
         _loc30_ = _loc19_ * _loc23_ + _loc20_ * _loc24_;
         _loc31_ = -(_loc17_ * _loc25_ + _loc18_ * _loc26_);
         _loc32_ = _loc19_ * _loc25_ + _loc20_ * _loc26_;
         if(_loc30_ <= 0 && _loc32_ <= 0)
         {
            param1.SetV(_loc11_);
            param2.SetV(_loc14_);
            _loc9_.SetV(_loc11_);
            _loc12_.SetV(_loc14_);
            _loc6_.SetV(_loc8_);
            return 1;
         }
         _loc33_ = _loc21_ * _loc24_ - _loc22_ * _loc23_;
         _loc34_ = _loc33_ * (_loc15_ * _loc18_ - _loc16_ * _loc17_);
         _loc36_ = _loc33_ * (_loc17_ * _loc20_ - _loc18_ * _loc19_);
         if(_loc36_ <= 0 && _loc31_ >= 0 && _loc32_ >= 0 && _loc31_ + _loc32_ > 0)
         {
            _loc35_ = _loc31_ / (_loc31_ + _loc32_);
            param1.x = _loc10_.x + _loc35_ * (_loc11_.x - _loc10_.x);
            param1.y = _loc10_.y + _loc35_ * (_loc11_.y - _loc10_.y);
            param2.x = _loc13_.x + _loc35_ * (_loc14_.x - _loc13_.x);
            param2.y = _loc13_.y + _loc35_ * (_loc14_.y - _loc13_.y);
            _loc9_.SetV(_loc11_);
            _loc12_.SetV(_loc14_);
            _loc6_.SetV(_loc8_);
            return 2;
         }
         _loc37_ = _loc33_ * (_loc19_ * _loc16_ - _loc20_ * _loc15_);
         if(_loc37_ <= 0 && _loc29_ >= 0 && _loc30_ >= 0 && _loc29_ + _loc30_ > 0)
         {
            _loc35_ = _loc29_ / (_loc29_ + _loc30_);
            param1.x = _loc9_.x + _loc35_ * (_loc11_.x - _loc9_.x);
            param1.y = _loc9_.y + _loc35_ * (_loc11_.y - _loc9_.y);
            param2.x = _loc12_.x + _loc35_ * (_loc14_.x - _loc12_.x);
            param2.y = _loc12_.y + _loc35_ * (_loc14_.y - _loc12_.y);
            _loc10_.SetV(_loc11_);
            _loc13_.SetV(_loc14_);
            _loc7_.SetV(_loc8_);
            return 2;
         }
         _loc38_ = _loc36_ + _loc37_ + _loc34_;
         _loc38_ = 1 / _loc38_;
         _loc39_ = _loc36_ * _loc38_;
         _loc40_ = _loc37_ * _loc38_;
         _loc41_ = 1 - _loc39_ - _loc40_;
         param1.x = _loc39_ * _loc9_.x + _loc40_ * _loc10_.x + _loc41_ * _loc11_.x;
         param1.y = _loc39_ * _loc9_.y + _loc40_ * _loc10_.y + _loc41_ * _loc11_.y;
         param2.x = _loc39_ * _loc12_.x + _loc40_ * _loc13_.x + _loc41_ * _loc14_.x;
         param2.y = _loc39_ * _loc12_.y + _loc40_ * _loc13_.y + _loc41_ * _loc14_.y;
         return 3;
      
}
static DistancePC(param1, param2, param3, param4, param5, param6) {
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = null;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         _loc9_ = b2Distance.gPoint;
         _loc8_ = param5.m_localPosition;
         _loc7_ = param6.R;
         _loc9_.p.x = param6.position.x + (_loc7_.col1.x * _loc8_.x + _loc7_.col2.x * _loc8_.y);
         _loc9_.p.y = param6.position.y + (_loc7_.col1.y * _loc8_.x + _loc7_.col2.y * _loc8_.y);
         _loc10_ = b2Distance.DistanceGeneric(param1,param2,param3,param4,_loc9_,b2Math.b2XForm_identity);
         _loc11_ = param5.m_radius - b2Settings.b2_toiSlop;
         if(_loc10_ > _loc11_)
         {
            _loc10_ -= _loc11_;
            _loc12_ = param2.x - param1.x;
            _loc13_ = param2.y - param1.y;
            _loc14_ = Math.sqrt(_loc12_ * _loc12_ + _loc13_ * _loc13_);
            _loc12_ /= _loc14_;
            _loc13_ /= _loc14_;
            param2.x -= _loc11_ * _loc12_;
            param2.y -= _loc11_ * _loc13_;
         }
         else
         {
            _loc10_ = 0;
            param2.x = param1.x;
            param2.y = param1.y;
         }
         return _loc10_;
      
}
static Distance(param1, param2, param3, param4, param5, param6) {
         var _loc7_ = 0;
         var _loc8_ = 0;
         _loc7_ = int(param3.m_type);
         _loc8_ = int(param5.m_type);
         if(_loc7_ == b2Shape.e_circleShape && _loc8_ == b2Shape.e_circleShape)
         {
            return b2Distance.DistanceCC(param1,param2,param3,param4,param5,param6);
         }
         if(_loc7_ == b2Shape.e_polygonShape && _loc8_ == b2Shape.e_circleShape)
         {
            return b2Distance.DistancePC(param1,param2,param3,param4,param5,param6);
         }
         if(_loc7_ == b2Shape.e_circleShape && _loc8_ == b2Shape.e_polygonShape)
         {
            return b2Distance.DistancePC(param2,param1,param5,param6,param3,param4);
         }
         if(_loc7_ == b2Shape.e_polygonShape && _loc8_ == b2Shape.e_polygonShape)
         {
            return b2Distance.DistanceGeneric(param1,param2,param3,param4,param5,param6);
         }
         return 0;
      
}
static ProcessTwo(param1, param2, param3, param4, param5) {
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = null;
         var _loc10_ = null;
         var _loc11_ = null;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         _loc6_ = param5[0];
         _loc7_ = param5[1];
         _loc8_ = param3[0];
         _loc9_ = param3[1];
         _loc10_ = param4[0];
         _loc11_ = param4[1];
         _loc12_ = -_loc7_.x;
         _loc13_ = -_loc7_.y;
         _loc14_ = _loc6_.x - _loc7_.x;
         _loc15_ = _loc6_.y - _loc7_.y;
         _loc16_ = Math.sqrt(_loc14_ * _loc14_ + _loc15_ * _loc15_);
         _loc14_ /= _loc16_;
         _loc15_ /= _loc16_;
         _loc17_ = _loc12_ * _loc14_ + _loc13_ * _loc15_;
         if(_loc17_ <= 0 || _loc16_ < Number.MIN_VALUE)
         {
            param1.SetV(_loc9_);
            param2.SetV(_loc11_);
            _loc8_.SetV(_loc9_);
            _loc10_.SetV(_loc11_);
            _loc6_.SetV(_loc7_);
            return 1;
         }
         _loc17_ /= _loc16_;
         param1.x = _loc9_.x + _loc17_ * (_loc8_.x - _loc9_.x);
         param1.y = _loc9_.y + _loc17_ * (_loc8_.y - _loc9_.y);
         param2.x = _loc11_.x + _loc17_ * (_loc10_.x - _loc11_.x);
         param2.y = _loc11_.y + _loc17_ * (_loc10_.y - _loc11_.y);
         return 2;
      
}
}
class b2Manifold {
points = null;
pointCount = 0;
normal = null;
constructor() {
         var _loc1_ = 0;
         
         this.points = new Array(b2Settings.b2_maxManifoldPoints);
         _loc1_ = int(0);
         while(_loc1_ < b2Settings.b2_maxManifoldPoints)
         {
            this.points[_loc1_] = new b2ManifoldPoint();
            _loc1_++;
         }
         this.normal = new b2Vec2();
      
}
Set(param1) {
         var _loc2_ = 0;
         this.pointCount = int(param1.pointCount);
         _loc2_ = int(0);
         while(_loc2_ < b2Settings.b2_maxManifoldPoints)
         {
            (this.points[_loc2_]).Set(param1.points[_loc2_]);
            _loc2_++;
         }
         this.normal.SetV(param1.normal);
      
}
Reset() {
         var _loc1_ = 0;
         _loc1_ = int(0);
         while(_loc1_ < b2Settings.b2_maxManifoldPoints)
         {
            (this.points[_loc1_]).Reset();
            _loc1_++;
         }
         this.normal.SetZero();
         this.pointCount = int(0);
      
}
}
class b2ManifoldPoint {
separation = NaN;
localPoint2 = new b2Vec2();
normalImpulse = NaN;
tangentImpulse = NaN;
localPoint1 = new b2Vec2();
id = new b2ContactID();
constructor() {
         
      
}
Set(param1) {
         this.localPoint1.SetV(param1.localPoint1);
         this.localPoint2.SetV(param1.localPoint2);
         this.separation = param1.separation;
         this.normalImpulse = param1.normalImpulse;
         this.tangentImpulse = param1.tangentImpulse;
         this.id.key = param1.id.key;
      
}
Reset() {
         this.localPoint1.SetZero();
         this.localPoint2.SetZero();
         this.separation = 0;
         this.normalImpulse = 0;
         this.tangentImpulse = 0;
         this.id.key = 0;
      
}
}
class b2OBB {
R = new b2Mat22();
center = new b2Vec2();
extents = new b2Vec2();
constructor() {
         
      
}
}
class b2Pair {
static b2_nullPair;
static b2_nullProxy;
static b2_tableCapacity;
static b2_tableMask;
static e_pairBuffered;
static e_pairRemoved;
static e_pairFinal;
userData = null;
proxyId1 = 0;
proxyId2 = 0;
status = 0;
next = 0;
constructor() {
         
      
}
SetBuffered() {
         this.status |= b2Pair.e_pairBuffered;
      
}
IsBuffered() {
         return (this.status & b2Pair.e_pairBuffered) == b2Pair.e_pairBuffered;
      
}
IsFinal() {
         return (this.status & b2Pair.e_pairFinal) == b2Pair.e_pairFinal;
      
}
ClearRemoved() {
         this.status &= ~b2Pair.e_pairRemoved;
      
}
SetFinal() {
         this.status |= b2Pair.e_pairFinal;
      
}
IsRemoved() {
         return (this.status & b2Pair.e_pairRemoved) == b2Pair.e_pairRemoved;
      
}
ClearBuffered() {
         this.status &= ~b2Pair.e_pairBuffered;
      
}
SetRemoved() {
         this.status |= b2Pair.e_pairRemoved;
      
}
}
class b2PairCallback {
constructor() {
         
      
}
PairRemoved(param1, param2, param3) {
      
}
PairAdded(param1, param2) {
         return null;
      
}
}
class b2PairManager {
m_pairCount = 0;
m_pairBuffer = null;
m_callback = null;
m_pairs = null;
m_pairBufferCount = 0;
m_hashTable = null;
m_broadPhase = null;
m_freePair = 0;
constructor() {
         var _loc1_ = 0;
         
         this.m_hashTable = new Array(b2Pair.b2_tableCapacity);
         _loc1_ = uint(0);
         while(_loc1_ < b2Pair.b2_tableCapacity)
         {
            this.m_hashTable[_loc1_] = b2Pair.b2_nullPair;
            _loc1_++;
         }
         this.m_pairs = new Array(b2Settings.b2_maxPairs);
         _loc1_ = uint(0);
         while(_loc1_ < b2Settings.b2_maxPairs)
         {
            this.m_pairs[_loc1_] = new b2Pair();
            _loc1_++;
         }
         this.m_pairBuffer = new Array(b2Settings.b2_maxPairs);
         _loc1_ = uint(0);
         while(_loc1_ < b2Settings.b2_maxPairs)
         {
            this.m_pairBuffer[_loc1_] = new b2BufferedPair();
            _loc1_++;
         }
         _loc1_ = uint(0);
         while(_loc1_ < b2Settings.b2_maxPairs)
         {
            this.m_pairs[_loc1_].proxyId1 = b2Pair.b2_nullProxy;
            this.m_pairs[_loc1_].proxyId2 = b2Pair.b2_nullProxy;
            this.m_pairs[_loc1_].userData = null;
            this.m_pairs[_loc1_].status = 0;
            this.m_pairs[_loc1_].next = _loc1_ + 1;
            _loc1_++;
         }
         this.m_pairs[int(b2Settings.b2_maxPairs - 1)].next = b2Pair.b2_nullPair;
         this.m_pairCount = int(0);
         this.m_pairBufferCount = int(0);
      
}
static EqualsPair(param1, param2) {
         return param1.proxyId1 == param2.proxyId1 && param1.proxyId2 == param2.proxyId2;
      
}
static Hash(param1, param2) {param1=uint(param1);param2=uint(param2);
         var _loc3_ = 0;
         _loc3_ = uint(uint(param2 << 16 & 0xFFFF0000 | param1));
         _loc3_ = uint(~_loc3_ + (_loc3_ << 15 & 0xFFFF8000));
         _loc3_ ^= _loc3_ >> 12 & 0x0FFFFF;
         _loc3_ += _loc3_ << 2 & 0xFFFFFFFC;
         _loc3_ ^= _loc3_ >> 4 & 0x0FFFFFFF;
         _loc3_ *= 2057;
         return uint(_loc3_ ^ _loc3_ >> 16 & 0xFFFF);
      
}
static Equals(param1, param2, param3) {param2=uint(param2);param3=uint(param3);
         return param1.proxyId1 == param2 && param1.proxyId2 == param3;
      
}
FindHash(param1, param2, param3) {param1=uint(param1);param2=uint(param2);param3=uint(param3);
         var _loc4_ = null;
         var _loc5_ = 0;
         _loc5_ = uint(uint(this.m_hashTable[param3]));
         _loc4_ = this.m_pairs[_loc5_];
         while(_loc5_ != b2Pair.b2_nullPair && b2PairManager.Equals(_loc4_,param1,param2) == false)
         {
            _loc5_ = uint(_loc4_.next);
            _loc4_ = this.m_pairs[_loc5_];
         }
         if(_loc5_ == b2Pair.b2_nullPair)
         {
            return null;
         }
         return _loc4_;
      
}
Find(param1, param2) {param1=uint(param1);param2=uint(param2);
         var _loc3_ = 0;
         var _loc4_ = 0;
         if(param1 > param2)
         {
            _loc4_ = uint(param1);
            param1 = uint(param2);
            param2 = uint(_loc4_);
         }
         _loc3_ = uint(uint(b2PairManager.Hash(param1,param2) & b2Pair.b2_tableMask));
         return this.FindHash(param1,param2,_loc3_);
      
}
ValidateBuffer() {
      
}
Commit() {
         var _loc1_ = null;
         var _loc2_ = 0;
         var _loc3_ = 0;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = null;
         _loc3_ = int(0);
         _loc4_ = this.m_broadPhase.m_proxyPool;
         _loc2_ = int(0);
         while(_loc2_ < this.m_pairBufferCount)
         {
            _loc1_ = this.m_pairBuffer[_loc2_];
            _loc5_ = this.Find(_loc1_.proxyId1,_loc1_.proxyId2);
            _loc5_.ClearBuffered();
            _loc6_ = _loc4_[_loc5_.proxyId1];
            _loc7_ = _loc4_[_loc5_.proxyId2];
            if(_loc5_.IsRemoved())
            {
               if(_loc5_.IsFinal() == true)
               {
                  this.m_callback.PairRemoved(_loc6_.userData,_loc7_.userData,_loc5_.userData);
               }
               _loc1_ = this.m_pairBuffer[_loc3_];
               _loc1_.proxyId1 = _loc5_.proxyId1;
               _loc1_.proxyId2 = _loc5_.proxyId2;
               _loc3_++;
            }
            else if(_loc5_.IsFinal() == false)
            {
               _loc5_.userData = this.m_callback.PairAdded(_loc6_.userData,_loc7_.userData);
               _loc5_.SetFinal();
            }
            _loc2_++;
         }
         _loc2_ = int(0);
         while(_loc2_ < _loc3_)
         {
            _loc1_ = this.m_pairBuffer[_loc2_];
            this.RemovePair(_loc1_.proxyId1,_loc1_.proxyId2);
            _loc2_++;
         }
         this.m_pairBufferCount = int(0);
         if(b2BroadPhase.s_validate)
         {
            this.ValidateTable();
         }
      
}
RemoveBufferedPair(param1, param2) {param1=int(param1);param2=int(param2);
         var _loc3_ = null;
         var _loc4_ = null;
         _loc4_ = this.Find(param1,param2);
         if(_loc4_ == null)
         {
            return;
         }
         if(_loc4_.IsBuffered() == false)
         {
            _loc4_.SetBuffered();
            _loc3_ = this.m_pairBuffer[this.m_pairBufferCount];
            _loc3_.proxyId1 = _loc4_.proxyId1;
            _loc3_.proxyId2 = _loc4_.proxyId2;
            ++this.m_pairBufferCount;
         }
         _loc4_.SetRemoved();
         if(b2BroadPhase.s_validate)
         {
            this.ValidateBuffer();
         }
      
}
RemovePair(param1, param2) {param1=uint(param1);param2=uint(param2);
         var _loc3_ = null;
         var _loc4_ = 0;
         var _loc5_ = 0;
         var _loc6_ = null;
         var _loc7_ = 0;
         var _loc8_ = 0;
         var _loc9_ = undefined;
         if(param1 > param2)
         {
            _loc7_ = uint(param1);
            param1 = uint(param2);
            param2 = uint(_loc7_);
         }
         _loc4_ = uint(uint(b2PairManager.Hash(param1,param2) & b2Pair.b2_tableMask));
         _loc5_ = uint(uint(this.m_hashTable[_loc4_]));
         _loc6_ = null;
         while(_loc5_ != b2Pair.b2_nullPair)
         {
            if(b2PairManager.Equals(this.m_pairs[_loc5_],param1,param2))
            {
               _loc8_ = uint(_loc5_);
               _loc3_ = this.m_pairs[_loc5_];
               if(_loc6_)
               {
                  _loc6_.next = _loc3_.next;
               }
               else
               {
                  this.m_hashTable[_loc4_] = _loc3_.next;
               }
               _loc3_ = this.m_pairs[_loc8_];
               _loc9_ = _loc3_.userData;
               _loc3_.next = this.m_freePair;
               _loc3_.proxyId1 = b2Pair.b2_nullProxy;
               _loc3_.proxyId2 = b2Pair.b2_nullProxy;
               _loc3_.userData = null;
               _loc3_.status = 0;
               this.m_freePair = uint(_loc8_);
               --this.m_pairCount;
               return _loc9_;
            }
            _loc6_ = this.m_pairs[_loc5_];
            _loc5_ = uint(_loc6_.next);
         }
         return null;
      
}
Initialize(param1, param2) {
         this.m_broadPhase = param1;
         this.m_callback = param2;
      
}
AddBufferedPair(param1, param2) {param1=int(param1);param2=int(param2);
         var _loc3_ = null;
         var _loc4_ = null;
         _loc4_ = this.AddPair(param1,param2);
         if(_loc4_.IsBuffered() == false)
         {
            _loc4_.SetBuffered();
            _loc3_ = this.m_pairBuffer[this.m_pairBufferCount];
            _loc3_.proxyId1 = _loc4_.proxyId1;
            _loc3_.proxyId2 = _loc4_.proxyId2;
            ++this.m_pairBufferCount;
         }
         _loc4_.ClearRemoved();
         if(b2BroadPhase.s_validate)
         {
            this.ValidateBuffer();
         }
      
}
AddPair(param1, param2) {param1=uint(param1);param2=uint(param2);
         var _loc3_ = 0;
         var _loc4_ = null;
         var _loc5_ = 0;
         var _loc6_ = 0;
         if(param1 > param2)
         {
            _loc6_ = uint(param1);
            param1 = uint(param2);
            param2 = uint(_loc6_);
         }
         _loc3_ = uint(uint(b2PairManager.Hash(param1,param2) & b2Pair.b2_tableMask));
         _loc4_ = _loc4_ = this.FindHash(param1,param2,_loc3_);
         if(_loc4_ != null)
         {
            return _loc4_;
         }
         _loc5_ = uint(this.m_freePair);
         _loc4_ = this.m_pairs[_loc5_];
         this.m_freePair = uint(_loc4_.next);
         _loc4_.proxyId1 = param1;
         _loc4_.proxyId2 = param2;
         _loc4_.status = 0;
         _loc4_.userData = null;
         _loc4_.next = this.m_hashTable[_loc3_];
         this.m_hashTable[_loc3_] = _loc5_;
         ++this.m_pairCount;
         return _loc4_;
      
}
ValidateTable() {
      
}
}
class b2Point {
p = new b2Vec2();
constructor() {
         
      
}
GetFirstVertex(param1) {
         return this.p;
      
}
Support(param1, param2, param3) {
         return this.p;
      
}
}
class b2Proxy {
overlapCount = 0;
lowerBounds = [uint(0),uint(0)];
upperBounds = [uint(0),uint(0)];
userData = null;
timeStamp = 0;
constructor() {
         
      
}
GetNext() {
         return this.lowerBounds[0];
      
}
IsValid() {
         return this.overlapCount != b2BroadPhase.b2_invalid;
      
}
SetNext(param1) {param1=uint(param1);
         this.lowerBounds[0] = param1 & 0xFFFF;
      
}
}
class b2Segment {
p1 = new b2Vec2();
p2 = new b2Vec2();
constructor() {
         
      
}
TestSegment(param1, param2, param3, param4) {
         var _loc5_ = null;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         _loc5_ = param3.p1;
         _loc6_ = param3.p2.x - _loc5_.x;
         _loc7_ = param3.p2.y - _loc5_.y;
         _loc8_ = this.p2.x - this.p1.x;
         _loc10_ = _loc9_ = this.p2.y - this.p1.y;
         _loc11_ = -_loc8_;
         _loc12_ = 100 * Number.MIN_VALUE;
         _loc13_ = -(_loc6_ * _loc10_ + _loc7_ * _loc11_);
         if(_loc13_ > _loc12_)
         {
            _loc14_ = _loc5_.x - this.p1.x;
            _loc15_ = _loc5_.y - this.p1.y;
            _loc16_ = _loc14_ * _loc10_ + _loc15_ * _loc11_;
            if(0 <= _loc16_ && _loc16_ <= param4 * _loc13_)
            {
               _loc17_ = -_loc6_ * _loc15_ + _loc7_ * _loc14_;
               if(-_loc12_ * _loc13_ <= _loc17_ && _loc17_ <= _loc13_ * (1 + _loc12_))
               {
                  _loc16_ /= _loc13_;
                  _loc18_ = Math.sqrt(_loc10_ * _loc10_ + _loc11_ * _loc11_);
                  _loc10_ /= _loc18_;
                  _loc11_ /= _loc18_;
                  param1[0] = _loc16_;
                  param2.Set(_loc10_,_loc11_);
                  return true;
               }
            }
         }
         return false;
      
}
}
class b2TimeOfImpact {
static s_p1;
static s_p2;
static s_xf1;
static s_xf2;
constructor() {
         
      
}
static TimeOfImpact(param1, param2, param3, param4) {
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = null;
         var _loc18_ = null;
         var _loc19_ = 0;
         var _loc20_ = 0;
         var _loc21_ = NaN;
         var _loc22_ = NaN;
         var _loc23_ = NaN;
         var _loc24_ = NaN;
         var _loc25_ = NaN;
         var _loc26_ = null;
         var _loc27_ = null;
         var _loc28_ = NaN;
         var _loc29_ = NaN;
         var _loc30_ = NaN;
         var _loc31_ = NaN;
         _loc7_ = param1.m_sweepRadius;
         _loc8_ = param3.m_sweepRadius;
         _loc9_ = param2.t0;
         _loc10_ = param2.c.x - param2.c0.x;
         _loc11_ = param2.c.y - param2.c0.y;
         _loc12_ = param4.c.x - param4.c0.x;
         _loc13_ = param4.c.y - param4.c0.y;
         _loc14_ = param2.a - param2.a0;
         _loc15_ = param4.a - param4.a0;
         _loc16_ = 0;
         _loc17_ = b2TimeOfImpact.s_p1;
         _loc18_ = b2TimeOfImpact.s_p2;
         _loc19_ = int(20);
         _loc20_ = int(0);
         _loc21_ = 0;
         _loc22_ = 0;
         _loc23_ = 0;
         _loc24_ = 0;
         while(true)
         {
            _loc25_ = (1 - _loc16_) * _loc9_ + _loc16_;
            _loc26_ = b2TimeOfImpact.s_xf1;
            _loc27_ = b2TimeOfImpact.s_xf2;
            param2.GetXForm(_loc26_,_loc25_);
            param4.GetXForm(_loc27_,_loc25_);
            _loc23_ = b2Distance.Distance(_loc17_,_loc18_,param1,_loc26_,param3,_loc27_);
            if(_loc20_ == 0)
            {
               if(_loc23_ > 2 * b2Settings.b2_toiSlop)
               {
                  _loc24_ = 1.5 * b2Settings.b2_toiSlop;
               }
               else
               {
                  _loc5_ = 0.05 * b2Settings.b2_toiSlop;
                  _loc6_ = _loc23_ - 0.5 * b2Settings.b2_toiSlop;
                  _loc24_ = _loc5_ > _loc6_ ? _loc5_ : _loc6_;
               }
            }
            if(_loc23_ - _loc24_ < 0.05 * b2Settings.b2_toiSlop || _loc20_ == _loc19_)
            {
               break;
            }
            _loc21_ = _loc18_.x - _loc17_.x;
            _loc22_ = _loc18_.y - _loc17_.y;
            _loc28_ = Math.sqrt(_loc21_ * _loc21_ + _loc22_ * _loc22_);
            _loc21_ /= _loc28_;
            _loc22_ /= _loc28_;
            _loc29_ = _loc21_ * (_loc10_ - _loc12_) + _loc22_ * (_loc11_ - _loc13_) + (_loc14_ < 0 ? -_loc14_ : _loc14_) * _loc7_ + (_loc15_ < 0 ? -_loc15_ : _loc15_) * _loc8_;
            if(_loc29_ == 0)
            {
               _loc16_ = 1;
               break;
            }
            _loc30_ = (_loc23_ - _loc24_) / _loc29_;
            _loc31_ = _loc16_ + _loc30_;
            if(_loc31_ < 0 || 1 < _loc31_)
            {
               _loc16_ = 1;
               break;
            }
            if(_loc31_ < (1 + 100 * Number.MIN_VALUE) * _loc16_)
            {
               break;
            }
            _loc16_ = _loc31_;
            _loc20_++;
         }
         return _loc16_;
      
}
}
class b2Mat22 {
col1 = new b2Vec2();
col2 = new b2Vec2();
constructor(param1 = 0, param2 = null, param3 = null) {
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         
         if(param2 != null && param3 != null)
         {
            this.col1.SetV(param2);
            this.col2.SetV(param3);
         }
         else
         {
            _loc4_ = Math.cos(param1);
            _loc5_ = Math.sin(param1);
            this.col1.x = _loc4_;
            this.col2.x = -_loc5_;
            this.col1.y = _loc5_;
            this.col2.y = _loc4_;
         }
      
}
SetIdentity() {
         this.col1.x = 1;
         this.col2.x = 0;
         this.col1.y = 0;
         this.col2.y = 1;
      
}
Set(param1) {
         var _loc2_ = NaN;
         var _loc3_ = NaN;
         _loc2_ = Math.cos(param1);
         _loc3_ = Math.sin(param1);
         this.col1.x = _loc2_;
         this.col2.x = -_loc3_;
         this.col1.y = _loc3_;
         this.col2.y = _loc2_;
      
}
SetVV(param1, param2) {
         this.col1.SetV(param1);
         this.col2.SetV(param2);
      
}
SetZero() {
         this.col1.x = 0;
         this.col2.x = 0;
         this.col1.y = 0;
         this.col2.y = 0;
      
}
SetM(param1) {
         this.col1.SetV(param1.col1);
         this.col2.SetV(param1.col2);
      
}
AddM(param1) {
         this.col1.x += param1.col1.x;
         this.col1.y += param1.col1.y;
         this.col2.x += param1.col2.x;
         this.col2.y += param1.col2.y;
      
}
Abs() {
         this.col1.Abs();
         this.col2.Abs();
      
}
Copy() {
         return new b2Mat22(0,this.col1,this.col2);
      
}
Invert(param1) {
         var _loc2_ = NaN;
         var _loc3_ = NaN;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         _loc2_ = this.col1.x;
         _loc3_ = this.col2.x;
         _loc4_ = this.col1.y;
         _loc5_ = this.col2.y;
         _loc6_ = _loc2_ * _loc5_ - _loc3_ * _loc4_;
         _loc6_ = 1 / _loc6_;
         param1.col1.x = _loc6_ * _loc5_;
         param1.col2.x = -_loc6_ * _loc3_;
         param1.col1.y = -_loc6_ * _loc4_;
         param1.col2.y = _loc6_ * _loc2_;
         return param1;
      
}
GetAngle() {
         return Math.atan2(this.col1.y,this.col1.x);
      
}
Solve(param1, param2, param3) {
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         _loc4_ = this.col1.x;
         _loc5_ = this.col2.x;
         _loc6_ = this.col1.y;
         _loc7_ = this.col2.y;
         _loc8_ = _loc4_ * _loc7_ - _loc5_ * _loc6_;
         _loc8_ = 1 / _loc8_;
         param1.x = _loc8_ * (_loc7_ * param2 - _loc5_ * param3);
         param1.y = _loc8_ * (_loc4_ * param3 - _loc6_ * param2);
         return param1;
      
}
}
class b2Math {
static b2Vec2_zero;
static b2Mat22_identity;
static b2XForm_identity;
constructor() {
         
      
}
static b2CrossVF(param1, param2) {
         var _loc3_ = null;
         return new b2Vec2(param2 * param1.y,-param2 * param1.x);
      
}
static AddVV(param1, param2) {
         var _loc3_ = null;
         return new b2Vec2(param1.x + param2.x,param1.y + param2.y);
      
}
static b2IsValid(param1) {
         return isFinite(param1);
      
}
static b2MinV(param1, param2) {
         var _loc3_ = null;
         return new b2Vec2(b2Math.b2Min(param1.x,param2.x),b2Math.b2Min(param1.y,param2.y));
      
}
static b2MulX(param1, param2) {
         var _loc3_ = null;
         _loc3_ = b2Math.b2MulMV(param1.R,param2);
         _loc3_.x += param1.position.x;
         _loc3_.y += param1.position.y;
         return _loc3_;
      
}
static b2DistanceSquared(param1, param2) {
         var _loc3_ = NaN;
         var _loc4_ = NaN;
         _loc3_ = param1.x - param2.x;
         _loc4_ = param1.y - param2.y;
         return _loc3_ * _loc3_ + _loc4_ * _loc4_;
      
}
static b2Swap(param1, param2) {
         var _loc3_ = undefined;
         _loc3_ = param1[0];
         param1[0] = param2[0];
         param2[0] = _loc3_;
      
}
static b2AbsM(param1) {
         var _loc2_ = null;
         return new b2Mat22(0,b2Math.b2AbsV(param1.col1),b2Math.b2AbsV(param1.col2));
      
}
static SubtractVV(param1, param2) {
         var _loc3_ = null;
         return new b2Vec2(param1.x - param2.x,param1.y - param2.y);
      
}
static b2MulXT(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = NaN;
         _loc3_ = b2Math.SubtractVV(param2,param1.position);
         _loc4_ = _loc3_.x * param1.R.col1.x + _loc3_.y * param1.R.col1.y;
         _loc3_.y = _loc3_.x * param1.R.col2.x + _loc3_.y * param1.R.col2.y;
         _loc3_.x = _loc4_;
         return _loc3_;
      
}
static b2Abs(param1) {
         return param1 > 0 ? param1 : -param1;
      
}
static b2Clamp(param1, param2, param3) {
         return b2Math.b2Max(param2,b2Math.b2Min(param1,param3));
      
}
static b2AbsV(param1) {
         var _loc2_ = null;
         return new b2Vec2(b2Math.b2Abs(param1.x),b2Math.b2Abs(param1.y));
      
}
static MulFV(param1, param2) {
         var _loc3_ = null;
         return new b2Vec2(param1 * param2.x,param1 * param2.y);
      
}
static b2CrossVV(param1, param2) {
         return param1.x * param2.y - param1.y * param2.x;
      
}
static b2Dot(param1, param2) {
         return param1.x * param2.x + param1.y * param2.y;
      
}
static b2CrossFV(param1, param2) {
         var _loc3_ = null;
         return new b2Vec2(-param1 * param2.y,param1 * param2.x);
      
}
static AddMM(param1, param2) {
         var _loc3_ = null;
         return new b2Mat22(0,b2Math.AddVV(param1.col1,param2.col1),b2Math.AddVV(param1.col2,param2.col2));
      
}
static b2Distance(param1, param2) {
         var _loc3_ = NaN;
         var _loc4_ = NaN;
         _loc3_ = param1.x - param2.x;
         _loc4_ = param1.y - param2.y;
         return Math.sqrt(_loc3_ * _loc3_ + _loc4_ * _loc4_);
      
}
static b2MulTMM(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         _loc3_ = new b2Vec2(b2Math.b2Dot(param1.col1,param2.col1),b2Math.b2Dot(param1.col2,param2.col1));
         _loc4_ = new b2Vec2(b2Math.b2Dot(param1.col1,param2.col2),b2Math.b2Dot(param1.col2,param2.col2));
         return new b2Mat22(0,_loc3_,_loc4_);
      
}
static b2MaxV(param1, param2) {
         var _loc3_ = null;
         return new b2Vec2(b2Math.b2Max(param1.x,param2.x),b2Math.b2Max(param1.y,param2.y));
      
}
static b2IsPowerOfTwo(param1) {param1=uint(param1);
         var _loc2_ = false;
         return param1 > 0 && (param1 & param1 - 1) == 0;
      
}
static b2ClampV(param1, param2, param3) {
         return b2Math.b2MaxV(param2,b2Math.b2MinV(param1,param3));
      
}
static b2RandomRange(param1, param2) {
         var _loc3_ = NaN;
         _loc3_ = Math.random();
         return (param2 - param1) * _loc3_ + param1;
      
}
static b2MulTMV(param1, param2) {
         var _loc3_ = null;
         return new b2Vec2(b2Math.b2Dot(param2,param1.col1),b2Math.b2Dot(param2,param1.col2));
      
}
static b2Min(param1, param2) {
         return param1 < param2 ? param1 : param2;
      
}
static b2Random() {
         return Math.random() * 2 - 1;
      
}
static b2MulMM(param1, param2) {
         var _loc3_ = null;
         return new b2Mat22(0,b2Math.b2MulMV(param1,param2.col1),b2Math.b2MulMV(param1,param2.col2));
      
}
static b2NextPowerOfTwo(param1) {param1=uint(param1);
         param1 |= param1 >> 1 & 0x7FFFFFFF;
         param1 |= param1 >> 2 & 0x3FFFFFFF;
         param1 |= param1 >> 4 & 0x0FFFFFFF;
         param1 |= param1 >> 8 & 0xFFFFFF;
         param1 |= param1 >> 16 & 0xFFFF;
         return param1 + 1;
      
}
static b2Max(param1, param2) {
         return param1 > param2 ? param1 : param2;
      
}
static b2MulMV(param1, param2) {
         var _loc3_ = null;
         return new b2Vec2(param1.col1.x * param2.x + param1.col2.x * param2.y,param1.col1.y * param2.x + param1.col2.y * param2.y);
      
}
}
class b2Sweep {
localCenter = new b2Vec2();
c = new b2Vec2();
a = NaN;
c0 = new b2Vec2();
a0 = NaN;
t0 = NaN;
constructor() {
         
      
}
Advance(param1) {
         var _loc2_ = NaN;
         if(this.t0 < param1 && 1 - this.t0 > Number.MIN_VALUE)
         {
            _loc2_ = (param1 - this.t0) / (1 - this.t0);
            this.c0.x = (1 - _loc2_) * this.c0.x + _loc2_ * this.c.x;
            this.c0.y = (1 - _loc2_) * this.c0.y + _loc2_ * this.c.y;
            this.a0 = (1 - _loc2_) * this.a0 + _loc2_ * this.a;
            this.t0 = param1;
         }
      
}
GetXForm(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         if(1 - this.t0 > Number.MIN_VALUE)
         {
            _loc4_ = (param2 - this.t0) / (1 - this.t0);
            param1.position.x = (1 - _loc4_) * this.c0.x + _loc4_ * this.c.x;
            param1.position.y = (1 - _loc4_) * this.c0.y + _loc4_ * this.c.y;
            _loc5_ = (1 - _loc4_) * this.a0 + _loc4_ * this.a;
            param1.R.Set(_loc5_);
         }
         else
         {
            param1.position.SetV(this.c);
            param1.R.Set(this.a);
         }
         _loc3_ = param1.R;
         param1.position.x -= _loc3_.col1.x * this.localCenter.x + _loc3_.col2.x * this.localCenter.y;
         param1.position.y -= _loc3_.col1.y * this.localCenter.x + _loc3_.col2.y * this.localCenter.y;
      
}
}
class b2Vec2 {
x = NaN;
y = NaN;
constructor(param1 = 0, param2 = 0) {
         
         this.x = param1;
         this.y = param2;
      
}
static Make(param1, param2) {
         return new b2Vec2(param1,param2);
      
}
Set(param1 = 0, param2 = 0) {
         this.x = param1;
         this.y = param2;
      
}
Multiply(param1) {
         this.x *= param1;
         this.y *= param1;
      
}
Length() {
         return Math.sqrt(this.x * this.x + this.y * this.y);
      
}
LengthSquared() {
         return this.x * this.x + this.y * this.y;
      
}
SetZero() {
         this.x = 0;
         this.y = 0;
      
}
Add(param1) {
         this.x += param1.x;
         this.y += param1.y;
      
}
MaxV(param1) {
         this.x = this.x > param1.x ? x : param1.x;
         this.y = this.y > param1.y ? y : param1.y;
      
}
SetV(param1) {
         this.x = param1.x;
         this.y = param1.y;
      
}
Negative() {
         return new b2Vec2(-this.x,-this.y);
      
}
CrossVF(param1) {
         var _loc2_ = NaN;
         _loc2_ = this.x;
         this.x = param1 * this.y;
         this.y = -param1 * _loc2_;
      
}
Abs() {
         if(this.x < 0)
         {
            this.x = -this.x;
         }
         if(this.y < 0)
         {
            this.y = -this.y;
         }
      
}
Copy() {
         return new b2Vec2(this.x,this.y);
      
}
MulTM(param1) {
         var _loc2_ = NaN;
         _loc2_ = b2Math.b2Dot(this,param1.col1);
         this.y = b2Math.b2Dot(this,param1.col2);
         this.x = _loc2_;
      
}
IsValid() {
         return b2Math.b2IsValid(this.x) && b2Math.b2IsValid(this.y);
      
}
MinV(param1) {
         this.x = this.x < param1.x ? x : param1.x;
         this.y = this.y < param1.y ? y : param1.y;
      
}
MulM(param1) {
         var _loc2_ = NaN;
         _loc2_ = this.x;
         this.x = param1.col1.x * _loc2_ + param1.col2.x * this.y;
         this.y = param1.col1.y * _loc2_ + param1.col2.y * this.y;
      
}
Normalize() {
         var _loc1_ = NaN;
         var _loc2_ = NaN;
         _loc1_ = Math.sqrt(this.x * this.x + this.y * this.y);
         if(_loc1_ < Number.MIN_VALUE)
         {
            return 0;
         }
         _loc2_ = 1 / _loc1_;
         this.x *= _loc2_;
         this.y *= _loc2_;
         return _loc1_;
      
}
Subtract(param1) {
         this.x -= param1.x;
         this.y -= param1.y;
      
}
CrossFV(param1) {
         var _loc2_ = NaN;
         _loc2_ = this.x;
         this.x = -param1 * this.y;
         this.y = param1 * _loc2_;
      
}
}
class b2XForm {
R = new b2Mat22();
position = new b2Vec2();
constructor(param1 = null, param2 = null) {
         
         if(param1)
         {
            this.position.SetV(param1);
            this.R.SetM(param2);
         }
      
}
Initialize(param1, param2) {
         this.position.SetV(param1);
         this.R.SetM(param2);
      
}
Set(param1) {
         this.position.SetV(param1.position);
         this.R.SetM(param1.R);
      
}
SetIdentity() {
         this.position.SetZero();
         this.R.SetIdentity();
      
}
}
class b2Color {
_g = 0;
_b = 0;
_r = 0;
constructor(param1, param2, param3) {
         
         this._r = uint(uint(255 * b2Math.b2Clamp(param1,0,1)));
         this._g = uint(uint(255 * b2Math.b2Clamp(param2,0,1)));
         this._b = uint(uint(255 * b2Math.b2Clamp(param3,0,1)));
      
}
Set(param1, param2, param3) {
         this._r = uint(uint(255 * b2Math.b2Clamp(param1,0,1)));
         this._g = uint(uint(255 * b2Math.b2Clamp(param2,0,1)));
         this._b = uint(uint(255 * b2Math.b2Clamp(param3,0,1)));
      
}
get color() {
         return this._r | this._g << 8 | this._b << 16;
      
}
set r(param1) {
         this._r = uint(uint(255 * b2Math.b2Clamp(param1,0,1)));
      
}
set b(param1) {
         this._b = uint(uint(255 * b2Math.b2Clamp(param1,0,1)));
      
}
set g(param1) {
         this._g = uint(uint(255 * b2Math.b2Clamp(param1,0,1)));
      
}
}
class b2Settings {
static USHRT_MAX;
static b2_pi;
static b2_maxManifoldPoints;
static b2_maxPolygonVertices;
static b2_maxProxies;
static b2_maxPairs;
static b2_linearSlop;
static b2_angularSlop;
static b2_toiSlop;
static b2_maxTOIContactsPerIsland;
static b2_velocityThreshold;
static b2_maxLinearCorrection;
static b2_maxAngularCorrection;
static b2_maxLinearVelocity;
static b2_maxLinearVelocitySquared;
static b2_maxAngularVelocity;
static b2_maxAngularVelocitySquared;
static b2_contactBaumgarte;
static b2_timeToSleep;
static b2_linearSleepTolerance;
static b2_angularSleepTolerance;
constructor() {
         
      
}
static b2Assert(param1) {
         if(!param1)
         {
            var _loc4_ = null.x + 1;
            null.x = _loc4_;
         }
      
}
}
class b2Contact {
static s_registers;
static e_nonSolidFlag;
static e_slowFlag;
static e_islandFlag;
static e_toiFlag;
static s_initialized;
m_shape1 = null;
m_shape2 = null;
m_prev = null;
m_toi = NaN;
m_next = null;
m_friction = NaN;
m_manifoldCount = 0;
m_node1 = new b2ContactEdge();
m_node2 = new b2ContactEdge();
m_restitution = NaN;
m_flags = 0;
constructor(param1 = null, param2 = null) {
         
         this.m_flags = uint(0);
         if(!param1 || !param2)
         {
            this.m_shape1 = null;
            this.m_shape2 = null;
            return;
         }
         if(param1.IsSensor() || param2.IsSensor())
         {
            this.m_flags |= b2Contact.e_nonSolidFlag;
         }
         this.m_shape1 = param1;
         this.m_shape2 = param2;
         this.m_manifoldCount = int(0);
         this.m_friction = Math.sqrt(this.m_shape1.m_friction * this.m_shape2.m_friction);
         this.m_restitution = b2Math.b2Max(this.m_shape1.m_restitution,this.m_shape2.m_restitution);
         this.m_prev = null;
         this.m_next = null;
         this.m_node1.contact = null;
         this.m_node1.prev = null;
         this.m_node1.next = null;
         this.m_node1.other = null;
         this.m_node2.contact = null;
         this.m_node2.prev = null;
         this.m_node2.next = null;
         this.m_node2.other = null;
      
}
static InitializeRegisters() {
         var _loc1_ = 0;
         var _loc2_ = 0;
         b2Contact.s_registers = new Array(b2Shape.e_shapeTypeCount);
         _loc1_ = int(0);
         while(_loc1_ < b2Shape.e_shapeTypeCount)
         {
            b2Contact.s_registers[_loc1_] = new Array(b2Shape.e_shapeTypeCount);
            _loc2_ = int(0);
            while(_loc2_ < b2Shape.e_shapeTypeCount)
            {
               b2Contact.s_registers[_loc1_][_loc2_] = new b2ContactRegister();
               _loc2_++;
            }
            _loc1_++;
         }
         b2Contact.AddType(b2CircleContact.Create,b2CircleContact.Destroy,b2Shape.e_circleShape,b2Shape.e_circleShape);
         b2Contact.AddType(b2PolyAndCircleContact.Create,b2PolyAndCircleContact.Destroy,b2Shape.e_polygonShape,b2Shape.e_circleShape);
         b2Contact.AddType(b2PolygonContact.Create,b2PolygonContact.Destroy,b2Shape.e_polygonShape,b2Shape.e_polygonShape);
      
}
static Destroy(param1, param2) {
         var _loc3_ = 0;
         var _loc4_ = 0;
         var _loc5_ = null;
         var _loc6_ = null;
         if(param1.m_manifoldCount > 0)
         {
            param1.m_shape1.m_body.WakeUp();
            param1.m_shape2.m_body.WakeUp();
         }
         _loc3_ = int(param1.m_shape1.m_type);
         _loc4_ = int(param1.m_shape2.m_type);
         _loc5_ = b2Contact.s_registers[_loc3_][_loc4_];
         _loc6_ = _loc5_.destroyFcn;
         _loc6_(param1,param2);
      
}
static AddType(param1, param2, param3, param4) {param3=int(param3);param4=int(param4);
         b2Contact.s_registers[param3][param4].createFcn = param1;
         b2Contact.s_registers[param3][param4].destroyFcn = param2;
         b2Contact.s_registers[param3][param4].primary = true;
         if(param3 != param4)
         {
            b2Contact.s_registers[param4][param3].createFcn = param1;
            b2Contact.s_registers[param4][param3].destroyFcn = param2;
            b2Contact.s_registers[param4][param3].primary = false;
         }
      
}
static Create(param1, param2, param3) {
         var _loc4_ = 0;
         var _loc5_ = 0;
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = 0;
         var _loc10_ = null;
         if(b2Contact.s_initialized == false)
         {
            b2Contact.InitializeRegisters();
            b2Contact.s_initialized = true;
         }
         _loc4_ = int(param1.m_type);
         _loc5_ = int(param2.m_type);
         _loc6_ = b2Contact.s_registers[_loc4_][_loc5_];
         _loc7_ = _loc6_.createFcn;
         if(_loc7_ != null)
         {
            if(_loc6_.primary)
            {
               return _loc7_(param1,param2,param3);
            }
            _loc8_ = _loc7_(param2,param1,param3);
            _loc9_ = int(0);
            while(_loc9_ < _loc8_.m_manifoldCount)
            {
               _loc10_ = _loc8_.GetManifolds()[_loc9_];
               _loc10_.normal = _loc10_.normal.Negative();
               _loc9_++;
            }
            return _loc8_;
         }
         return null;
      
}
GetShape1() {
         return this.m_shape1;
      
}
IsSolid() {
         return (this.m_flags & b2Contact.e_nonSolidFlag) == 0;
      
}
GetNext() {
         return this.m_next;
      
}
GetManifolds() {
         return null;
      
}
GetShape2() {
         return this.m_shape2;
      
}
GetManifoldCount() {
         return this.m_manifoldCount;
      
}
Update(param1) {
         var _loc2_ = 0;
         var _loc3_ = 0;
         var _loc4_ = null;
         var _loc5_ = null;
         _loc2_ = int(this.m_manifoldCount);
         this.Evaluate(param1);
         _loc3_ = int(this.m_manifoldCount);
         _loc4_ = this.m_shape1.m_body;
         _loc5_ = this.m_shape2.m_body;
         if(_loc3_ == 0 && _loc2_ > 0)
         {
            _loc4_.WakeUp();
            _loc5_.WakeUp();
         }
         if(_loc4_.IsStatic() || _loc4_.IsBullet() || _loc5_.IsStatic() || _loc5_.IsBullet())
         {
            this.m_flags &= ~b2Contact.e_slowFlag;
         }
         else
         {
            this.m_flags |= b2Contact.e_slowFlag;
         }
      
}
Evaluate(param1) {
      
}
}
class b2ContactConstraint {
points = null;
restitution = NaN;
body1 = null;
manifold = null;
normal = new b2Vec2();
body2 = null;
friction = NaN;
pointCount = 0;
constructor() {
         var _loc1_ = 0;
         
         this.points = new Array(b2Settings.b2_maxManifoldPoints);
         _loc1_ = int(0);
         while(_loc1_ < b2Settings.b2_maxManifoldPoints)
         {
            this.points[_loc1_] = new b2ContactConstraintPoint();
            _loc1_++;
         }
      
}
}
class b2ContactConstraintPoint {
r2 = new b2Vec2();
separation = NaN;
positionImpulse = NaN;
normalImpulse = NaN;
equalizedMass = NaN;
tangentMass = NaN;
tangentImpulse = NaN;
localAnchor1 = new b2Vec2();
localAnchor2 = new b2Vec2();
normalMass = NaN;
velocityBias = NaN;
r1 = new b2Vec2();
constructor() {
         
      
}
}
class b2ContactEdge {
next = null;
other = null;
contact = null;
prev = null;
constructor() {
         
      
}
}
class b2ContactRegister {
primary = false;
createFcn = null;
destroyFcn = null;
constructor() {
         
      
}
}
class b2ContactResult {
normal = new b2Vec2();
position = new b2Vec2();
shape1 = null;
shape2 = null;
normalImpulse = NaN;
tangentImpulse = NaN;
id = new b2ContactID();
constructor() {
         
      
}
}
class b2ContactSolver {
m_constraintCount = 0;
m_constraints = new Array();
m_allocator = null;
m_step = new b2TimeStep();
constructor(param1, param2, param3, param4) {param3=int(param3);
         var _loc5_ = null;
         var _loc6_ = 0;
         var _loc8_ = null;
         var _loc9_ = 0;
         var _loc10_ = null;
         var _loc11_ = null;
         var _loc12_ = 0;
         var _loc13_ = null;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         var _loc22_ = 0;
         var _loc23_ = null;
         var _loc24_ = NaN;
         var _loc25_ = NaN;
         var _loc26_ = null;
         var _loc27_ = 0;
         var _loc28_ = null;
         var _loc29_ = null;
         var _loc30_ = NaN;
         var _loc31_ = NaN;
         var _loc32_ = NaN;
         var _loc33_ = NaN;
         var _loc34_ = NaN;
         var _loc35_ = NaN;
         var _loc36_ = NaN;
         var _loc37_ = NaN;
         var _loc38_ = NaN;
         var _loc39_ = NaN;
         var _loc40_ = NaN;
         var _loc41_ = NaN;
         var _loc42_ = NaN;
         var _loc43_ = NaN;
         var _loc44_ = NaN;
         var _loc45_ = NaN;
         var _loc46_ = NaN;
         var _loc47_ = NaN;
         
         this.m_step.dt = param1.dt;
         this.m_step.inv_dt = param1.inv_dt;
         this.m_step.maxIterations = param1.maxIterations;
         this.m_allocator = param4;
         this.m_constraintCount = int(0);
         _loc6_ = int(0);
         while(_loc6_ < param3)
         {
            _loc5_ = param2[_loc6_];
            this.m_constraintCount += _loc5_.m_manifoldCount;
            _loc6_++;
         }
         _loc6_ = int(0);
         while(_loc6_ < this.m_constraintCount)
         {
            this.m_constraints[_loc6_] = new b2ContactConstraint();
            _loc6_++;
         }
         _loc9_ = int(0);
         _loc6_ = int(0);
         while(_loc6_ < param3)
         {
            _loc5_ = param2[_loc6_];
            _loc10_ = _loc5_.m_shape1.m_body;
            _loc11_ = _loc5_.m_shape2.m_body;
            _loc12_ = int(_loc5_.m_manifoldCount);
            _loc13_ = _loc5_.GetManifolds();
            _loc14_ = _loc5_.m_friction;
            _loc15_ = _loc5_.m_restitution;
            _loc16_ = _loc10_.m_linearVelocity.x;
            _loc17_ = _loc10_.m_linearVelocity.y;
            _loc18_ = _loc11_.m_linearVelocity.x;
            _loc19_ = _loc11_.m_linearVelocity.y;
            _loc20_ = _loc10_.m_angularVelocity;
            _loc21_ = _loc11_.m_angularVelocity;
            _loc22_ = int(0);
            while(_loc22_ < _loc12_)
            {
               _loc23_ = _loc13_[_loc22_];
               _loc24_ = _loc23_.normal.x;
               _loc25_ = _loc23_.normal.y;
               _loc26_ = this.m_constraints[_loc9_];
               _loc26_.body1 = _loc10_;
               _loc26_.body2 = _loc11_;
               _loc26_.manifold = _loc23_;
               _loc26_.normal.x = _loc24_;
               _loc26_.normal.y = _loc25_;
               _loc26_.pointCount = _loc23_.pointCount;
               _loc26_.friction = _loc14_;
               _loc26_.restitution = _loc15_;
               _loc27_ = uint(0);
               while(_loc27_ < _loc26_.pointCount)
               {
                  _loc28_ = _loc23_.points[_loc27_];
                  _loc29_ = _loc26_.points[_loc27_];
                  _loc29_.normalImpulse = _loc28_.normalImpulse;
                  _loc29_.tangentImpulse = _loc28_.tangentImpulse;
                  _loc29_.separation = _loc28_.separation;
                  _loc29_.positionImpulse = 0;
                  _loc29_.localAnchor1.SetV(_loc28_.localPoint1);
                  _loc29_.localAnchor2.SetV(_loc28_.localPoint2);
                  _loc8_ = _loc10_.m_xf.R;
                  _loc32_ = _loc28_.localPoint1.x - _loc10_.m_sweep.localCenter.x;
                  _loc33_ = _loc28_.localPoint1.y - _loc10_.m_sweep.localCenter.y;
                  _loc30_ = _loc8_.col1.x * _loc32_ + _loc8_.col2.x * _loc33_;
                  _loc33_ = _loc8_.col1.y * _loc32_ + _loc8_.col2.y * _loc33_;
                  _loc32_ = _loc30_;
                  _loc29_.r1.Set(_loc32_,_loc33_);
                  _loc8_ = _loc11_.m_xf.R;
                  _loc34_ = _loc28_.localPoint2.x - _loc11_.m_sweep.localCenter.x;
                  _loc35_ = _loc28_.localPoint2.y - _loc11_.m_sweep.localCenter.y;
                  _loc30_ = _loc8_.col1.x * _loc34_ + _loc8_.col2.x * _loc35_;
                  _loc35_ = _loc8_.col1.y * _loc34_ + _loc8_.col2.y * _loc35_;
                  _loc34_ = _loc30_;
                  _loc29_.r2.Set(_loc34_,_loc35_);
                  _loc36_ = _loc32_ * _loc32_ + _loc33_ * _loc33_;
                  _loc37_ = _loc34_ * _loc34_ + _loc35_ * _loc35_;
                  _loc38_ = _loc32_ * _loc24_ + _loc33_ * _loc25_;
                  _loc39_ = _loc34_ * _loc24_ + _loc35_ * _loc25_;
                  _loc40_ = _loc10_.m_invMass + _loc11_.m_invMass;
                  _loc40_ = _loc40_ + (_loc10_.m_invI * (_loc36_ - _loc38_ * _loc38_) + _loc11_.m_invI * (_loc37_ - _loc39_ * _loc39_));
                  _loc29_.normalMass = 1 / _loc40_;
                  _loc41_ = _loc10_.m_mass * _loc10_.m_invMass + _loc11_.m_mass * _loc11_.m_invMass;
                  _loc41_ = _loc41_ + (_loc10_.m_mass * _loc10_.m_invI * (_loc36_ - _loc38_ * _loc38_) + _loc11_.m_mass * _loc11_.m_invI * (_loc37_ - _loc39_ * _loc39_));
                  _loc29_.equalizedMass = 1 / _loc41_;
                  _loc42_ = _loc25_;
                  _loc43_ = -_loc24_;
                  _loc44_ = _loc32_ * _loc42_ + _loc33_ * _loc43_;
                  _loc45_ = _loc34_ * _loc42_ + _loc35_ * _loc43_;
                  _loc46_ = _loc10_.m_invMass + _loc11_.m_invMass;
                  _loc46_ = _loc46_ + (_loc10_.m_invI * (_loc36_ - _loc44_ * _loc44_) + _loc11_.m_invI * (_loc37_ - _loc45_ * _loc45_));
                  _loc29_.tangentMass = 1 / _loc46_;
                  _loc29_.velocityBias = 0;
                  if(_loc29_.separation > 0)
                  {
                     _loc29_.velocityBias = -60 * _loc29_.separation;
                  }
                  _loc30_ = _loc18_ + -_loc21_ * _loc35_ - _loc16_ - -_loc20_ * _loc33_;
                  _loc31_ = _loc19_ + _loc21_ * _loc34_ - _loc17_ - _loc20_ * _loc32_;
                  _loc47_ = _loc26_.normal.x * _loc30_ + _loc26_.normal.y * _loc31_;
                  if(_loc47_ < -b2Settings.b2_velocityThreshold)
                  {
                     _loc29_.velocityBias += -_loc26_.restitution * _loc47_;
                  }
                  _loc27_++;
               }
               _loc9_++;
               _loc22_++;
            }
            _loc6_++;
         }
      
}
InitVelocityConstraints(param1) {
         var _loc5_ = 0;
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = 0;
         var _loc19_ = 0;
         var _loc20_ = null;
         var _loc21_ = NaN;
         var _loc22_ = NaN;
         var _loc23_ = null;
         _loc5_ = int(0);
         while(_loc5_ < this.m_constraintCount)
         {
            _loc6_ = this.m_constraints[_loc5_];
            _loc7_ = _loc6_.body1;
            _loc8_ = _loc6_.body2;
            _loc9_ = _loc7_.m_invMass;
            _loc10_ = _loc7_.m_invI;
            _loc11_ = _loc8_.m_invMass;
            _loc12_ = _loc8_.m_invI;
            _loc13_ = _loc6_.normal.x;
            _loc15_ = _loc14_ = _loc6_.normal.y;
            _loc16_ = -_loc13_;
            if(param1.warmStarting)
            {
               _loc19_ = int(_loc6_.pointCount);
               _loc18_ = int(0);
               while(_loc18_ < _loc19_)
               {
                  _loc20_ = _loc6_.points[_loc18_];
                  _loc20_.normalImpulse *= param1.dtRatio;
                  _loc20_.tangentImpulse *= param1.dtRatio;
                  _loc21_ = _loc20_.normalImpulse * _loc13_ + _loc20_.tangentImpulse * _loc15_;
                  _loc22_ = _loc20_.normalImpulse * _loc14_ + _loc20_.tangentImpulse * _loc16_;
                  _loc7_.m_angularVelocity -= _loc10_ * (_loc20_.r1.x * _loc22_ - _loc20_.r1.y * _loc21_);
                  _loc7_.m_linearVelocity.x -= _loc9_ * _loc21_;
                  _loc7_.m_linearVelocity.y -= _loc9_ * _loc22_;
                  _loc8_.m_angularVelocity += _loc12_ * (_loc20_.r2.x * _loc22_ - _loc20_.r2.y * _loc21_);
                  _loc8_.m_linearVelocity.x += _loc11_ * _loc21_;
                  _loc8_.m_linearVelocity.y += _loc11_ * _loc22_;
                  _loc18_++;
               }
            }
            else
            {
               _loc19_ = int(_loc6_.pointCount);
               _loc18_ = int(0);
               while(_loc18_ < _loc19_)
               {
                  _loc23_ = _loc6_.points[_loc18_];
                  _loc23_.normalImpulse = 0;
                  _loc23_.tangentImpulse = 0;
                  _loc18_++;
               }
            }
            _loc5_++;
         }
      
}
SolvePositionConstraints(param1) {
         var _loc2_ = NaN;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = 0;
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = null;
         var _loc10_ = NaN;
         var _loc11_ = null;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = 0;
         var _loc20_ = 0;
         var _loc21_ = null;
         var _loc22_ = NaN;
         var _loc23_ = NaN;
         var _loc24_ = NaN;
         var _loc25_ = NaN;
         var _loc26_ = NaN;
         var _loc27_ = NaN;
         var _loc28_ = NaN;
         var _loc29_ = NaN;
         var _loc30_ = NaN;
         var _loc31_ = NaN;
         var _loc32_ = NaN;
         var _loc33_ = NaN;
         var _loc34_ = NaN;
         var _loc35_ = NaN;
         var _loc36_ = NaN;
         var _loc37_ = NaN;
         var _loc38_ = NaN;
         _loc2_ = 0;
         _loc5_ = int(0);
         while(_loc5_ < this.m_constraintCount)
         {
            _loc6_ = this.m_constraints[_loc5_];
            _loc7_ = _loc6_.body1;
            _loc8_ = _loc6_.body2;
            _loc9_ = _loc7_.m_sweep.c;
            _loc10_ = _loc7_.m_sweep.a;
            _loc11_ = _loc8_.m_sweep.c;
            _loc12_ = _loc8_.m_sweep.a;
            _loc13_ = _loc7_.m_mass * _loc7_.m_invMass;
            _loc14_ = _loc7_.m_mass * _loc7_.m_invI;
            _loc15_ = _loc8_.m_mass * _loc8_.m_invMass;
            _loc16_ = _loc8_.m_mass * _loc8_.m_invI;
            _loc17_ = _loc6_.normal.x;
            _loc18_ = _loc6_.normal.y;
            _loc19_ = int(_loc6_.pointCount);
            _loc20_ = int(0);
            while(_loc20_ < _loc19_)
            {
               _loc21_ = _loc6_.points[_loc20_];
               _loc3_ = _loc7_.m_xf.R;
               _loc4_ = _loc7_.m_sweep.localCenter;
               _loc22_ = _loc21_.localAnchor1.x - _loc4_.x;
               _loc23_ = _loc21_.localAnchor1.y - _loc4_.y;
               _loc26_ = _loc3_.col1.x * _loc22_ + _loc3_.col2.x * _loc23_;
               _loc23_ = _loc3_.col1.y * _loc22_ + _loc3_.col2.y * _loc23_;
               _loc22_ = _loc26_;
               _loc3_ = _loc8_.m_xf.R;
               _loc4_ = _loc8_.m_sweep.localCenter;
               _loc24_ = _loc21_.localAnchor2.x - _loc4_.x;
               _loc25_ = _loc21_.localAnchor2.y - _loc4_.y;
               _loc26_ = _loc3_.col1.x * _loc24_ + _loc3_.col2.x * _loc25_;
               _loc25_ = _loc3_.col1.y * _loc24_ + _loc3_.col2.y * _loc25_;
               _loc24_ = _loc26_;
               _loc27_ = _loc9_.x + _loc22_;
               _loc28_ = _loc9_.y + _loc23_;
               _loc29_ = _loc11_.x + _loc24_;
               _loc30_ = _loc11_.y + _loc25_;
               _loc31_ = _loc29_ - _loc27_;
               _loc32_ = _loc30_ - _loc28_;
               _loc33_ = _loc31_ * _loc17_ + _loc32_ * _loc18_ + _loc21_.separation;
               _loc2_ = b2Math.b2Min(_loc2_,_loc33_);
               _loc34_ = param1 * b2Math.b2Clamp(_loc33_ + b2Settings.b2_linearSlop,-b2Settings.b2_maxLinearCorrection,0);
               _loc35_ = -_loc21_.equalizedMass * _loc34_;
               _loc36_ = _loc21_.positionImpulse;
               _loc21_.positionImpulse = b2Math.b2Max(_loc36_ + _loc35_,0);
               _loc35_ = _loc21_.positionImpulse - _loc36_;
               _loc37_ = _loc35_ * _loc17_;
               _loc38_ = _loc35_ * _loc18_;
               _loc9_.x -= _loc13_ * _loc37_;
               _loc9_.y -= _loc13_ * _loc38_;
               _loc10_ -= _loc14_ * (_loc22_ * _loc38_ - _loc23_ * _loc37_);
               _loc7_.m_sweep.a = _loc10_;
               _loc7_.SynchronizeTransform();
               _loc11_.x += _loc15_ * _loc37_;
               _loc11_.y += _loc15_ * _loc38_;
               _loc12_ += _loc16_ * (_loc24_ * _loc38_ - _loc25_ * _loc37_);
               _loc8_.m_sweep.a = _loc12_;
               _loc8_.SynchronizeTransform();
               _loc20_++;
            }
            _loc5_++;
         }
         return _loc2_ >= -1.5 * b2Settings.b2_linearSlop;
      
}
SolveVelocityConstraints() {
         var _loc1_ = 0;
         var _loc2_ = null;
         var _loc3_ = NaN;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc19_ = 0;
         var _loc20_ = null;
         var _loc21_ = null;
         var _loc22_ = null;
         var _loc23_ = NaN;
         var _loc24_ = NaN;
         var _loc25_ = null;
         var _loc26_ = null;
         var _loc27_ = NaN;
         var _loc28_ = NaN;
         var _loc29_ = NaN;
         var _loc30_ = NaN;
         var _loc31_ = NaN;
         var _loc32_ = NaN;
         var _loc33_ = NaN;
         var _loc34_ = NaN;
         var _loc35_ = NaN;
         var _loc36_ = NaN;
         var _loc37_ = 0;
         var _loc38_ = NaN;
         _loc19_ = int(0);
         while(_loc19_ < this.m_constraintCount)
         {
            _loc20_ = this.m_constraints[_loc19_];
            _loc21_ = _loc20_.body1;
            _loc22_ = _loc20_.body2;
            _loc23_ = _loc21_.m_angularVelocity;
            _loc24_ = _loc22_.m_angularVelocity;
            _loc25_ = _loc21_.m_linearVelocity;
            _loc26_ = _loc22_.m_linearVelocity;
            _loc27_ = _loc21_.m_invMass;
            _loc28_ = _loc21_.m_invI;
            _loc29_ = _loc22_.m_invMass;
            _loc30_ = _loc22_.m_invI;
            _loc31_ = _loc20_.normal.x;
            _loc33_ = _loc32_ = _loc20_.normal.y;
            _loc34_ = -_loc31_;
            _loc35_ = _loc20_.friction;
            _loc37_ = int(_loc20_.pointCount);
            _loc1_ = int(0);
            while(_loc1_ < _loc37_)
            {
               _loc2_ = _loc20_.points[_loc1_];
               _loc7_ = _loc26_.x + -_loc24_ * _loc2_.r2.y - _loc25_.x - -_loc23_ * _loc2_.r1.y;
               _loc8_ = _loc26_.y + _loc24_ * _loc2_.r2.x - _loc25_.y - _loc23_ * _loc2_.r1.x;
               _loc9_ = _loc7_ * _loc31_ + _loc8_ * _loc32_;
               _loc11_ = -_loc2_.normalMass * (_loc9_ - _loc2_.velocityBias);
               _loc10_ = _loc7_ * _loc33_ + _loc8_ * _loc34_;
               _loc12_ = _loc2_.tangentMass * -_loc10_;
               _loc13_ = b2Math.b2Max(_loc2_.normalImpulse + _loc11_,0);
               _loc11_ = _loc13_ - _loc2_.normalImpulse;
               _loc38_ = _loc35_ * _loc2_.normalImpulse;
               _loc14_ = b2Math.b2Clamp(_loc2_.tangentImpulse + _loc12_,-_loc38_,_loc38_);
               _loc12_ = _loc14_ - _loc2_.tangentImpulse;
               _loc15_ = _loc11_ * _loc31_ + _loc12_ * _loc33_;
               _loc16_ = _loc11_ * _loc32_ + _loc12_ * _loc34_;
               _loc25_.x -= _loc27_ * _loc15_;
               _loc25_.y -= _loc27_ * _loc16_;
               _loc23_ -= _loc28_ * (_loc2_.r1.x * _loc16_ - _loc2_.r1.y * _loc15_);
               _loc26_.x += _loc29_ * _loc15_;
               _loc26_.y += _loc29_ * _loc16_;
               _loc24_ += _loc30_ * (_loc2_.r2.x * _loc16_ - _loc2_.r2.y * _loc15_);
               _loc2_.normalImpulse = _loc13_;
               _loc2_.tangentImpulse = _loc14_;
               _loc1_++;
            }
            _loc21_.m_angularVelocity = _loc23_;
            _loc22_.m_angularVelocity = _loc24_;
            _loc19_++;
         }
      
}
FinalizeVelocityConstraints() {
         var _loc1_ = 0;
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = 0;
         var _loc5_ = null;
         var _loc6_ = null;
         _loc1_ = int(0);
         while(_loc1_ < this.m_constraintCount)
         {
            _loc2_ = this.m_constraints[_loc1_];
            _loc3_ = _loc2_.manifold;
            _loc4_ = int(0);
            while(_loc4_ < _loc2_.pointCount)
            {
               _loc5_ = _loc3_.points[_loc4_];
               _loc6_ = _loc2_.points[_loc4_];
               _loc5_.normalImpulse = _loc6_.normalImpulse;
               _loc5_.tangentImpulse = _loc6_.tangentImpulse;
               _loc4_++;
            }
            _loc1_++;
         }
      
}
}
class b2Jacobian {
linear1 = new b2Vec2();
linear2 = new b2Vec2();
angular2 = NaN;
angular1 = NaN;
constructor() {
         
      
}
Set(param1, param2, param3, param4) {
         this.linear1.SetV(param1);
         this.angular1 = param2;
         this.linear2.SetV(param3);
         this.angular2 = param4;
      
}
SetZero() {
         this.linear1.SetZero();
         this.angular1 = 0;
         this.linear2.SetZero();
         this.angular2 = 0;
      
}
Compute(param1, param2, param3, param4) {
         return this.linear1.x * param1.x + this.linear1.y * param1.y + this.angular1 * param2 + (this.linear2.x * param3.x + this.linear2.y * param3.y) + this.angular2 * param4;
      
}
}
class b2Joint {
static e_unknownJoint;
static e_revoluteJoint;
static e_prismaticJoint;
static e_distanceJoint;
static e_pulleyJoint;
static e_mouseJoint;
static e_gearJoint;
static e_inactiveLimit;
static e_atLowerLimit;
static e_atUpperLimit;
static e_equalLimits;
m_islandFlag = false;
m_body1 = null;
m_prev = null;
m_next = null;
m_type = 0;
m_collideConnected = false;
m_node1 = new b2JointEdge();
m_node2 = new b2JointEdge();
m_inv_dt = NaN;
m_userData = null;
m_body2 = null;
constructor(param1) {
         
         this.m_type = int(param1.type);
         this.m_prev = null;
         this.m_next = null;
         this.m_body1 = param1.body1;
         this.m_body2 = param1.body2;
         this.m_collideConnected = param1.collideConnected;
         this.m_islandFlag = false;
         this.m_userData = param1.userData;
      
}
static Destroy(param1, param2) {
      
}
static Create(param1, param2) {
         var _loc3_ = null;
         _loc3_ = null;
         switch(param1.type)
         {
            case b2Joint.e_distanceJoint:
               _loc3_ = new b2DistanceJoint(param1);
               break;
            case b2Joint.e_mouseJoint:
               _loc3_ = new b2MouseJoint(param1);
               break;
            case b2Joint.e_prismaticJoint:
               _loc3_ = new b2PrismaticJoint(param1);
               break;
            case b2Joint.e_revoluteJoint:
               _loc3_ = new b2RevoluteJoint(param1);
               break;
            case b2Joint.e_pulleyJoint:
               _loc3_ = new b2PulleyJoint(param1);
               break;
            case b2Joint.e_gearJoint:
               _loc3_ = new b2GearJoint(param1);
         }
         return _loc3_;
      
}
GetAnchor1() {
         return null;
      
}
GetAnchor2() {
         return null;
      
}
InitVelocityConstraints(param1) {
      
}
GetType() {
         return this.m_type;
      
}
GetBody2() {
         return this.m_body2;
      
}
GetNext() {
         return this.m_next;
      
}
GetReactionTorque() {
         return 0;
      
}
GetUserData() {
         return this.m_userData;
      
}
GetReactionForce() {
         return null;
      
}
SolvePositionConstraints() {
         return false;
      
}
SetUserData(param1) {
         this.m_userData = param1;
      
}
GetBody1() {
         return this.m_body1;
      
}
SolveVelocityConstraints(param1) {
      
}
InitPositionConstraints() {
      
}
}
class b2JointDef {
collideConnected = false;
body1 = null;
body2 = null;
userData = null;
type = 0;
constructor() {
         
         this.type = int(b2Joint.e_unknownJoint);
         this.userData = null;
         this.body1 = null;
         this.body2 = null;
         this.collideConnected = false;
      
}
}
class b2JointEdge {
joint = null;
other = null;
next = null;
prev = null;
constructor() {
         
      
}
}
class b2Body {
static s_massData;
static s_xf1;
static e_frozenFlag;
static e_islandFlag;
static e_sleepFlag;
static e_allowSleepFlag;
static e_bulletFlag;
static e_fixedRotationFlag;
static e_staticType;
static e_dynamicType;
static e_maxTypes;
m_next = null;
m_contactList = null;
m_angularVelocity = NaN;
m_shapeList = null;
m_force = new b2Vec2();
m_mass = NaN;
m_sweep = new b2Sweep();
m_xf = new b2XForm();
m_torque = NaN;
m_userData = null;
m_flags = 0;
m_world = null;
m_prev = null;
m_invMass = NaN;
m_type = 0;
m_linearDamping = NaN;
m_angularDamping = NaN;
m_invI = NaN;
m_linearVelocity = new b2Vec2();
m_sleepTime = NaN;
m_shapeCount = 0;
m_jointList = null;
m_I = NaN;
constructor(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = null;
         
         this.m_flags = uint(0);
         if(param1.isBullet)
         {
            this.m_flags |= b2Body.e_bulletFlag;
         }
         if(param1.fixedRotation)
         {
            this.m_flags |= b2Body.e_fixedRotationFlag;
         }
         if(param1.allowSleep)
         {
            this.m_flags |= b2Body.e_allowSleepFlag;
         }
         if(param1.isSleeping)
         {
            this.m_flags |= b2Body.e_sleepFlag;
         }
         this.m_world = param2;
         this.m_xf.position.SetV(param1.position);
         this.m_xf.R.Set(param1.angle);
         this.m_sweep.localCenter.SetV(param1.massData.center);
         this.m_sweep.t0 = 1;
         this.m_sweep.a0 = this.m_sweep.a = param1.angle;
         _loc3_ = this.m_xf.R;
         _loc4_ = this.m_sweep.localCenter;
         this.m_sweep.c.x = _loc3_.col1.x * _loc4_.x + _loc3_.col2.x * _loc4_.y;
         this.m_sweep.c.y = _loc3_.col1.y * _loc4_.x + _loc3_.col2.y * _loc4_.y;
         this.m_sweep.c.x += this.m_xf.position.x;
         this.m_sweep.c.y += this.m_xf.position.y;
         this.m_sweep.c0.SetV(this.m_sweep.c);
         this.m_jointList = null;
         this.m_contactList = null;
         this.m_prev = null;
         this.m_next = null;
         this.m_linearDamping = param1.linearDamping;
         this.m_angularDamping = param1.angularDamping;
         this.m_force.Set(0,0);
         this.m_torque = 0;
         this.m_linearVelocity.SetZero();
         this.m_angularVelocity = 0;
         this.m_sleepTime = 0;
         this.m_invMass = 0;
         this.m_I = 0;
         this.m_invI = 0;
         this.m_mass = param1.massData.mass;
         if(this.m_mass > 0)
         {
            this.m_invMass = 1 / this.m_mass;
         }
         if((this.m_flags & b2Body.e_fixedRotationFlag) == 0)
         {
            this.m_I = param1.massData.I;
         }
         if(this.m_I > 0)
         {
            this.m_invI = 1 / this.m_I;
         }
         if(this.m_invMass == 0 && this.m_invI == 0)
         {
            this.m_type = int(b2Body.e_staticType);
         }
         else
         {
            this.m_type = int(b2Body.e_dynamicType);
         }
         this.m_userData = param1.userData;
         this.m_shapeList = null;
         this.m_shapeCount = int(0);
      
}
GetLinearVelocityFromWorldPoint(param1) {
         return new b2Vec2(this.m_linearVelocity.x - this.m_angularVelocity * (param1.y - this.m_sweep.c.y),this.m_linearVelocity.y + this.m_angularVelocity * (param1.x - this.m_sweep.c.x));
      
}
SetLinearVelocity(param1) {
         this.m_linearVelocity.SetV(param1);
      
}
WakeUp() {
         this.m_flags &= ~b2Body.e_sleepFlag;
         this.m_sleepTime = 0;
      
}
GetLocalCenter() {
         return this.m_sweep.localCenter;
      
}
ApplyTorque(param1) {
         if(this.IsSleeping())
         {
            this.WakeUp();
         }
         this.m_torque += param1;
      
}
IsFrozen() {
         return (this.m_flags & b2Body.e_frozenFlag) == b2Body.e_frozenFlag;
      
}
IsDynamic() {
         return this.m_type == b2Body.e_dynamicType;
      
}
GetLinearVelocity() {
         return this.m_linearVelocity;
      
}
SynchronizeTransform() {
         var _loc1_ = null;
         var _loc2_ = null;
         this.m_xf.R.Set(this.m_sweep.a);
         _loc1_ = this.m_xf.R;
         _loc2_ = this.m_sweep.localCenter;
         this.m_xf.position.x = this.m_sweep.c.x - (_loc1_.col1.x * _loc2_.x + _loc1_.col2.x * _loc2_.y);
         this.m_xf.position.y = this.m_sweep.c.y - (_loc1_.col1.y * _loc2_.x + _loc1_.col2.y * _loc2_.y);
      
}
GetInertia() {
         return this.m_I;
      
}
IsSleeping() {
         return (this.m_flags & b2Body.e_sleepFlag) == b2Body.e_sleepFlag;
      
}
SetMassFromShapes() {
         var _loc1_ = null;
         var _loc2_ = NaN;
         var _loc3_ = NaN;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = 0;
         if(this.m_world.m_lock == true)
         {
            return;
         }
         this.m_mass = 0;
         this.m_invMass = 0;
         this.m_I = 0;
         this.m_invI = 0;
         _loc2_ = 0;
         _loc3_ = 0;
         _loc4_ = b2Body.s_massData;
         _loc1_ = this.m_shapeList;
         while(_loc1_)
         {
            _loc1_.ComputeMass(_loc4_);
            this.m_mass += _loc4_.mass;
            _loc2_ += _loc4_.mass * _loc4_.center.x;
            _loc3_ += _loc4_.mass * _loc4_.center.y;
            this.m_I += _loc4_.I;
            _loc1_ = _loc1_.m_next;
         }
         if(this.m_mass > 0)
         {
            this.m_invMass = 1 / this.m_mass;
            _loc2_ *= this.m_invMass;
            _loc3_ *= this.m_invMass;
         }
         if(this.m_I > 0 && (this.m_flags & b2Body.e_fixedRotationFlag) == 0)
         {
            this.m_I -= this.m_mass * (_loc2_ * _loc2_ + _loc3_ * _loc3_);
            this.m_invI = 1 / this.m_I;
         }
         else
         {
            this.m_I = 0;
            this.m_invI = 0;
         }
         this.m_sweep.localCenter.Set(_loc2_,_loc3_);
         _loc5_ = this.m_xf.R;
         _loc6_ = this.m_sweep.localCenter;
         this.m_sweep.c.x = _loc5_.col1.x * _loc6_.x + _loc5_.col2.x * _loc6_.y;
         this.m_sweep.c.y = _loc5_.col1.y * _loc6_.x + _loc5_.col2.y * _loc6_.y;
         this.m_sweep.c.x += this.m_xf.position.x;
         this.m_sweep.c.y += this.m_xf.position.y;
         this.m_sweep.c0.SetV(this.m_sweep.c);
         _loc1_ = this.m_shapeList;
         while(_loc1_)
         {
            _loc1_.UpdateSweepRadius(this.m_sweep.localCenter);
            _loc1_ = _loc1_.m_next;
         }
         _loc7_ = int(this.m_type);
         if(this.m_invMass == 0 && this.m_invI == 0)
         {
            this.m_type = int(b2Body.e_staticType);
         }
         else
         {
            this.m_type = int(b2Body.e_dynamicType);
         }
         if(_loc7_ != this.m_type)
         {
            _loc1_ = this.m_shapeList;
            while(_loc1_)
            {
               _loc1_.RefilterProxy(this.m_world.m_broadPhase,this.m_xf);
               _loc1_ = _loc1_.m_next;
            }
         }
      
}
PutToSleep() {
         this.m_flags |= b2Body.e_sleepFlag;
         this.m_sleepTime = 0;
         this.m_linearVelocity.SetZero();
         this.m_angularVelocity = 0;
         this.m_force.SetZero();
         this.m_torque = 0;
      
}
GetJointList() {
         return this.m_jointList;
      
}
SetXForm(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = false;
         var _loc7_ = false;
         if(this.m_world.m_lock == true)
         {
            return true;
         }
         if(this.IsFrozen())
         {
            return false;
         }
         this.m_xf.R.Set(param2);
         this.m_xf.position.SetV(param1);
         _loc4_ = this.m_xf.R;
         _loc5_ = this.m_sweep.localCenter;
         this.m_sweep.c.x = _loc4_.col1.x * _loc5_.x + _loc4_.col2.x * _loc5_.y;
         this.m_sweep.c.y = _loc4_.col1.y * _loc5_.x + _loc4_.col2.y * _loc5_.y;
         this.m_sweep.c.x += this.m_xf.position.x;
         this.m_sweep.c.y += this.m_xf.position.y;
         this.m_sweep.c0.SetV(this.m_sweep.c);
         this.m_sweep.a0 = this.m_sweep.a = param2;
         _loc6_ = false;
         _loc3_ = this.m_shapeList;
         while(_loc3_)
         {
            _loc7_ = _loc3_.Synchronize(this.m_world.m_broadPhase,this.m_xf,this.m_xf);
            if(_loc7_ == false)
            {
               _loc6_ = true;
               break;
            }
            _loc3_ = _loc3_.m_next;
         }
         if(_loc6_ == true)
         {
            this.m_flags |= b2Body.e_frozenFlag;
            this.m_linearVelocity.SetZero();
            this.m_angularVelocity = 0;
            _loc3_ = this.m_shapeList;
            while(_loc3_)
            {
               _loc3_.DestroyProxy(this.m_world.m_broadPhase);
               _loc3_ = _loc3_.m_next;
            }
            return false;
         }
         this.m_world.m_broadPhase.Commit();
         return true;
      
}
GetLocalPoint(param1) {
         return b2Math.b2MulXT(this.m_xf,param1);
      
}
ApplyForce(param1, param2) {
         if(this.IsSleeping())
         {
            this.WakeUp();
         }
         this.m_force.x += param1.x;
         this.m_force.y += param1.y;
         this.m_torque += (param2.x - this.m_sweep.c.x) * param1.y - (param2.y - this.m_sweep.c.y) * param1.x;
      
}
SynchronizeShapes() {
         var _loc1_ = null;
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = false;
         _loc1_ = b2Body.s_xf1;
         _loc1_.R.Set(this.m_sweep.a0);
         _loc2_ = _loc1_.R;
         _loc3_ = this.m_sweep.localCenter;
         _loc1_.position.x = this.m_sweep.c0.x - (_loc2_.col1.x * _loc3_.x + _loc2_.col2.x * _loc3_.y);
         _loc1_.position.y = this.m_sweep.c0.y - (_loc2_.col1.y * _loc3_.x + _loc2_.col2.y * _loc3_.y);
         _loc5_ = true;
         _loc4_ = this.m_shapeList;
         while(_loc4_)
         {
            _loc5_ = _loc4_.Synchronize(this.m_world.m_broadPhase,_loc1_,this.m_xf);
            if(_loc5_ == false)
            {
               break;
            }
            _loc4_ = _loc4_.m_next;
         }
         if(_loc5_ == false)
         {
            this.m_flags |= b2Body.e_frozenFlag;
            this.m_linearVelocity.SetZero();
            this.m_angularVelocity = 0;
            _loc4_ = this.m_shapeList;
            while(_loc4_)
            {
               _loc4_.DestroyProxy(this.m_world.m_broadPhase);
               _loc4_ = _loc4_.m_next;
            }
            return false;
         }
         return true;
      
}
GetAngle() {
         return this.m_sweep.a;
      
}
GetXForm() {
         return this.m_xf;
      
}
ApplyImpulse(param1, param2) {
         if(this.IsSleeping())
         {
            this.WakeUp();
         }
         this.m_linearVelocity.x += this.m_invMass * param1.x;
         this.m_linearVelocity.y += this.m_invMass * param1.y;
         this.m_angularVelocity += this.m_invI * ((param2.x - this.m_sweep.c.x) * param1.y - (param2.y - this.m_sweep.c.y) * param1.x);
      
}
GetNext() {
         return this.m_next;
      
}
GetMass() {
         return this.m_mass;
      
}
GetLinearVelocityFromLocalPoint(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         _loc2_ = this.m_xf.R;
         _loc3_ = new b2Vec2(_loc2_.col1.x * param1.x + _loc2_.col2.x * param1.y,_loc2_.col1.y * param1.x + _loc2_.col2.y * param1.y);
         _loc3_.x += this.m_xf.position.x;
         _loc3_.y += this.m_xf.position.y;
         return new b2Vec2(this.m_linearVelocity.x + this.m_angularVelocity * (_loc3_.y - this.m_sweep.c.y),this.m_linearVelocity.x - this.m_angularVelocity * (_loc3_.x - this.m_sweep.c.x));
      
}
GetAngularVelocity() {
         return this.m_angularVelocity;
      
}
SetAngularVelocity(param1) {
         this.m_angularVelocity = param1;
      
}
SetMass(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = 0;
         if(this.m_world.m_lock == true)
         {
            return;
         }
         this.m_invMass = 0;
         this.m_I = 0;
         this.m_invI = 0;
         this.m_mass = param1.mass;
         if(this.m_mass > 0)
         {
            this.m_invMass = 1 / this.m_mass;
         }
         if((this.m_flags & b2Body.e_fixedRotationFlag) == 0)
         {
            this.m_I = param1.I;
         }
         if(this.m_I > 0)
         {
            this.m_invI = 1 / this.m_I;
         }
         this.m_sweep.localCenter.SetV(param1.center);
         _loc3_ = this.m_xf.R;
         _loc4_ = this.m_sweep.localCenter;
         this.m_sweep.c.x = _loc3_.col1.x * _loc4_.x + _loc3_.col2.x * _loc4_.y;
         this.m_sweep.c.y = _loc3_.col1.y * _loc4_.x + _loc3_.col2.y * _loc4_.y;
         this.m_sweep.c.x += this.m_xf.position.x;
         this.m_sweep.c.y += this.m_xf.position.y;
         this.m_sweep.c0.SetV(this.m_sweep.c);
         _loc2_ = this.m_shapeList;
         while(_loc2_)
         {
            _loc2_.UpdateSweepRadius(this.m_sweep.localCenter);
            _loc2_ = _loc2_.m_next;
         }
         _loc5_ = int(this.m_type);
         if(this.m_invMass == 0 && this.m_invI == 0)
         {
            this.m_type = int(b2Body.e_staticType);
         }
         else
         {
            this.m_type = int(b2Body.e_dynamicType);
         }
         if(_loc5_ != this.m_type)
         {
            _loc2_ = this.m_shapeList;
            while(_loc2_)
            {
               _loc2_.RefilterProxy(this.m_world.m_broadPhase,this.m_xf);
               _loc2_ = _loc2_.m_next;
            }
         }
      
}
IsStatic() {
         return this.m_type == b2Body.e_staticType;
      
}
GetWorldVector(param1) {
         return b2Math.b2MulMV(this.m_xf.R,param1);
      
}
GetShapeList() {
         return this.m_shapeList;
      
}
Advance(param1) {
         this.m_sweep.Advance(param1);
         this.m_sweep.c.SetV(this.m_sweep.c0);
         this.m_sweep.a = this.m_sweep.a0;
         this.SynchronizeTransform();
      
}
SetBullet(param1) {
         if(param1)
         {
            this.m_flags |= b2Body.e_bulletFlag;
         }
         else
         {
            this.m_flags &= ~b2Body.e_bulletFlag;
         }
      
}
CreateShape(param1) {
         var _loc2_ = null;
         if(this.m_world.m_lock == true)
         {
            return null;
         }
         _loc2_ = b2Shape.Create(param1,this.m_world.m_blockAllocator);
         _loc2_.m_next = this.m_shapeList;
         this.m_shapeList = _loc2_;
         ++this.m_shapeCount;
         _loc2_.m_body = this;
         _loc2_.CreateProxy(this.m_world.m_broadPhase,this.m_xf);
         _loc2_.UpdateSweepRadius(this.m_sweep.localCenter);
         return _loc2_;
      
}
IsConnected(param1) {
         var _loc2_ = null;
         _loc2_ = this.m_jointList;
         while(_loc2_)
         {
            if(_loc2_.other == param1)
            {
               return _loc2_.joint.m_collideConnected == false;
            }
            _loc2_ = _loc2_.next;
         }
         return false;
      
}
DestroyShape(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = false;
         if(this.m_world.m_lock == true)
         {
            return;
         }
         param1.DestroyProxy(this.m_world.m_broadPhase);
         _loc2_ = this.m_shapeList;
         _loc3_ = null;
         _loc4_ = false;
         while(_loc2_ != null)
         {
            if(_loc2_ == param1)
            {
               if(_loc3_)
               {
                  _loc3_.m_next = param1.m_next;
               }
               else
               {
                  this.m_shapeList = param1.m_next;
               }
               _loc4_ = true;
               break;
            }
            _loc3_ = _loc2_;
            _loc2_ = _loc2_.m_next;
         }
         param1.m_body = null;
         param1.m_next = null;
         --this.m_shapeCount;
         b2Shape.Destroy(param1,this.m_world.m_blockAllocator);
      
}
GetUserData() {
         return this.m_userData;
      
}
IsBullet() {
         return (this.m_flags & b2Body.e_bulletFlag) == b2Body.e_bulletFlag;
      
}
GetWorldCenter() {
         return this.m_sweep.c;
      
}
AllowSleeping(param1) {
         if(param1)
         {
            this.m_flags |= b2Body.e_allowSleepFlag;
         }
         else
         {
            this.m_flags &= ~b2Body.e_allowSleepFlag;
            this.WakeUp();
         }
      
}
SetUserData(param1) {
         this.m_userData = param1;
      
}
GetLocalVector(param1) {
         return b2Math.b2MulTMV(this.m_xf.R,param1);
      
}
GetWorldPoint(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         _loc2_ = this.m_xf.R;
         _loc3_ = new b2Vec2(_loc2_.col1.x * param1.x + _loc2_.col2.x * param1.y,_loc2_.col1.y * param1.x + _loc2_.col2.y * param1.y);
         _loc3_.x += this.m_xf.position.x;
         _loc3_.y += this.m_xf.position.y;
         return _loc3_;
      
}
GetWorld() {
         return this.m_world;
      
}
GetPosition() {
         return this.m_xf.position;
      
}
}
class b2BodyDef {
isSleeping = false;
position = new b2Vec2();
isBullet = false;
allowSleep = false;
userData = null;
angularDamping = NaN;
fixedRotation = false;
angle = NaN;
linearDamping = NaN;
massData = new b2MassData();
constructor() {
         
         this.massData.center.SetZero();
         this.massData.mass = 0;
         this.massData.I = 0;
         this.userData = null;
         this.position.Set(0,0);
         this.angle = 0;
         this.linearDamping = 0;
         this.angularDamping = 0;
         this.allowSleep = true;
         this.isSleeping = false;
         this.fixedRotation = false;
         this.isBullet = false;
      
}
}
class b2BoundaryListener {
constructor() {
         
      
}
Violation(param1) {
      
}
}
class b2ContactFilter {
static b2_defaultFilter;
constructor() {
         
      
}
ShouldCollide(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = false;
         _loc3_ = param1.GetFilterData();
         _loc4_ = param2.GetFilterData();
         if(_loc3_.groupIndex == _loc4_.groupIndex && _loc3_.groupIndex != 0)
         {
            return _loc3_.groupIndex > 0;
         }
         return (_loc3_.maskBits & _loc4_.categoryBits) != 0 && (_loc3_.categoryBits & _loc4_.maskBits) != 0;
      
}
}
class b2ContactListener {
constructor() {
         
      
}
Add(param1) {
      
}
Remove(param1) {
      
}
Persist(param1) {
      
}
Result(param1) {
      
}
}
class b2DebugDraw {
static e_shapeBit;
static e_jointBit;
static e_coreShapeBit;
static e_aabbBit;
static e_obbBit;
static e_pairBit;
static e_centerOfMassBit;
m_xformScale = 1;
m_fillAlpha = 1;
m_alpha = 1;
m_lineThickness = 1;
m_drawFlags = 0;
m_sprite = null;
m_drawScale = 1;
constructor() {
         
         this.m_drawFlags = uint(0);
      
}
DrawSolidPolygon(param1, param2, param3) {param2=int(param2);
         var _loc4_ = 0;
         this.m_sprite.graphics.lineStyle(this.m_lineThickness,param3.color,this.m_alpha);
         this.m_sprite.graphics.moveTo(param1[0].x * this.m_drawScale,param1[0].y * this.m_drawScale);
         this.m_sprite.graphics.beginFill(param3.color,this.m_fillAlpha);
         _loc4_ = int(1);
         while(_loc4_ < param2)
         {
            this.m_sprite.graphics.lineTo(param1[_loc4_].x * this.m_drawScale,param1[_loc4_].y * this.m_drawScale);
            _loc4_++;
         }
         this.m_sprite.graphics.lineTo(param1[0].x * this.m_drawScale,param1[0].y * this.m_drawScale);
         this.m_sprite.graphics.endFill();
      
}
DrawCircle(param1, param2, param3) {
         this.m_sprite.graphics.lineStyle(this.m_lineThickness,param3.color,this.m_alpha);
         this.m_sprite.graphics.drawCircle(param1.x * this.m_drawScale,param1.y * this.m_drawScale,param2 * this.m_drawScale);
      
}
DrawXForm(param1) {
         this.m_sprite.graphics.lineStyle(this.m_lineThickness,16711680,this.m_alpha);
         this.m_sprite.graphics.moveTo(param1.position.x * this.m_drawScale,param1.position.y * this.m_drawScale);
         this.m_sprite.graphics.lineTo((param1.position.x + this.m_xformScale * param1.R.col1.x) * this.m_drawScale,(param1.position.y + this.m_xformScale * param1.R.col1.y) * this.m_drawScale);
         this.m_sprite.graphics.lineStyle(this.m_lineThickness,65280,this.m_alpha);
         this.m_sprite.graphics.moveTo(param1.position.x * this.m_drawScale,param1.position.y * this.m_drawScale);
         this.m_sprite.graphics.lineTo((param1.position.x + this.m_xformScale * param1.R.col2.x) * this.m_drawScale,(param1.position.y + this.m_xformScale * param1.R.col2.y) * this.m_drawScale);
      
}
ClearFlags(param1) {param1=uint(param1);
         this.m_drawFlags &= ~param1;
      
}
DrawSolidCircle(param1, param2, param3, param4) {
         this.m_sprite.graphics.lineStyle(this.m_lineThickness,param4.color,this.m_alpha);
         this.m_sprite.graphics.moveTo(0,0);
         this.m_sprite.graphics.beginFill(param4.color,this.m_fillAlpha);
         this.m_sprite.graphics.drawCircle(param1.x * this.m_drawScale,param1.y * this.m_drawScale,param2 * this.m_drawScale);
         this.m_sprite.graphics.endFill();
         this.m_sprite.graphics.moveTo(param1.x * this.m_drawScale,param1.y * this.m_drawScale);
         this.m_sprite.graphics.lineTo((param1.x + param3.x * param2) * this.m_drawScale,(param1.y + param3.y * param2) * this.m_drawScale);
      
}
SetFlags(param1) {param1=uint(param1);
         this.m_drawFlags = uint(param1);
      
}
AppendFlags(param1) {param1=uint(param1);
         this.m_drawFlags |= param1;
      
}
DrawSegment(param1, param2, param3) {
         this.m_sprite.graphics.lineStyle(this.m_lineThickness,param3.color,this.m_alpha);
         this.m_sprite.graphics.moveTo(param1.x * this.m_drawScale,param1.y * this.m_drawScale);
         this.m_sprite.graphics.lineTo(param2.x * this.m_drawScale,param2.y * this.m_drawScale);
      
}
GetFlags() {
         return this.m_drawFlags;
      
}
DrawPolygon(param1, param2, param3) {param2=int(param2);
         var _loc4_ = 0;
         this.m_sprite.graphics.lineStyle(this.m_lineThickness,param3.color,this.m_alpha);
         this.m_sprite.graphics.moveTo(param1[0].x * this.m_drawScale,param1[0].y * this.m_drawScale);
         _loc4_ = int(1);
         while(_loc4_ < param2)
         {
            this.m_sprite.graphics.lineTo(param1[_loc4_].x * this.m_drawScale,param1[_loc4_].y * this.m_drawScale);
            _loc4_++;
         }
         this.m_sprite.graphics.lineTo(param1[0].x * this.m_drawScale,param1[0].y * this.m_drawScale);
      
}
}
class b2DestructionListener {
constructor() {
         
      
}
SayGoodbyeJoint(param1) {
      
}
SayGoodbyeShape(param1) {
      
}
}
class b2Island {
static s_reportCR;
m_joints = null;
m_listener = null;
m_positionIterationCount = 0;
m_bodyCapacity = 0;
m_bodies = null;
m_jointCapacity = 0;
m_contactCount = 0;
m_contacts = null;
m_contactCapacity = 0;
m_jointCount = 0;
m_allocator = null;
m_bodyCount = 0;
constructor(param1, param2, param3, param4, param5) {param1=int(param1);param2=int(param2);param3=int(param3);
         var _loc6_ = 0;
         
         this.m_bodyCapacity = int(param1);
         this.m_contactCapacity = int(param2);
         this.m_jointCapacity = int(param3);
         this.m_bodyCount = int(0);
         this.m_contactCount = int(0);
         this.m_jointCount = int(0);
         this.m_allocator = param4;
         this.m_listener = param5;
         this.m_bodies = new Array(param1);
         _loc6_ = int(0);
         while(_loc6_ < param1)
         {
            this.m_bodies[_loc6_] = null;
            _loc6_++;
         }
         this.m_contacts = new Array(param2);
         _loc6_ = int(0);
         while(_loc6_ < param2)
         {
            this.m_contacts[_loc6_] = null;
            _loc6_++;
         }
         this.m_joints = new Array(param3);
         _loc6_ = int(0);
         while(_loc6_ < param3)
         {
            this.m_joints[_loc6_] = null;
            _loc6_++;
         }
         this.m_positionIterationCount = int(0);
      
}
AddBody(param1) {
         this.m_bodies[this.m_bodyCount++] = param1;
      
}
AddJoint(param1) {
         this.m_joints[this.m_jointCount++] = param1;
      
}
Report(param1) {
         var _loc4_ = 0;
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = 0;
         var _loc10_ = null;
         var _loc11_ = 0;
         var _loc12_ = null;
         var _loc13_ = 0;
         var _loc14_ = null;
         var _loc15_ = null;
         if(this.m_listener == null)
         {
            return;
         }
         _loc4_ = int(0);
         while(_loc4_ < this.m_contactCount)
         {
            _loc5_ = this.m_contacts[_loc4_];
            _loc6_ = param1[_loc4_];
            _loc7_ = b2Island.s_reportCR;
            _loc7_.shape1 = _loc5_.m_shape1;
            _loc7_.shape2 = _loc5_.m_shape2;
            _loc8_ = _loc7_.shape1.m_body;
            _loc9_ = int(_loc5_.m_manifoldCount);
            _loc10_ = _loc5_.GetManifolds();
            _loc11_ = int(0);
            while(_loc11_ < _loc9_)
            {
               _loc12_ = _loc10_[_loc11_];
               _loc7_.normal.SetV(_loc12_.normal);
               _loc13_ = int(0);
               while(_loc13_ < _loc12_.pointCount)
               {
                  _loc14_ = _loc12_.points[_loc13_];
                  _loc15_ = _loc6_.points[_loc13_];
                  _loc7_.position = _loc8_.GetWorldPoint(_loc14_.localPoint1);
                  _loc7_.normalImpulse = _loc15_.normalImpulse;
                  _loc7_.tangentImpulse = _loc15_.tangentImpulse;
                  _loc7_.id.key = _loc14_.id.key;
                  this.m_listener.Result(_loc7_);
                  _loc13_++;
               }
               _loc11_++;
            }
            _loc4_++;
         }
      
}
Solve(param1, param2, param3, param4) {
         var _loc5_ = 0;
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = 0;
         var _loc10_ = false;
         var _loc11_ = false;
         var _loc12_ = false;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         _loc5_ = int(0);
         while(_loc5_ < this.m_bodyCount)
         {
            _loc6_ = this.m_bodies[_loc5_];
            if(!_loc6_.IsStatic())
            {
               _loc6_.m_linearVelocity.x += param1.dt * (param2.x + _loc6_.m_invMass * _loc6_.m_force.x);
               _loc6_.m_linearVelocity.y += param1.dt * (param2.y + _loc6_.m_invMass * _loc6_.m_force.y);
               _loc6_.m_angularVelocity += param1.dt * _loc6_.m_invI * _loc6_.m_torque;
               _loc6_.m_force.SetZero();
               _loc6_.m_torque = 0;
               _loc6_.m_linearVelocity.Multiply(b2Math.b2Clamp(1 - param1.dt * _loc6_.m_linearDamping,0,1));
               _loc6_.m_angularVelocity *= b2Math.b2Clamp(1 - param1.dt * _loc6_.m_angularDamping,0,1);
               if(_loc6_.m_linearVelocity.LengthSquared() > b2Settings.b2_maxLinearVelocitySquared)
               {
                  _loc6_.m_linearVelocity.Normalize();
                  _loc6_.m_linearVelocity.x *= b2Settings.b2_maxLinearVelocity;
                  _loc6_.m_linearVelocity.y *= b2Settings.b2_maxLinearVelocity;
               }
               if(_loc6_.m_angularVelocity * _loc6_.m_angularVelocity > b2Settings.b2_maxAngularVelocitySquared)
               {
                  if(_loc6_.m_angularVelocity < 0)
                  {
                     _loc6_.m_angularVelocity = -b2Settings.b2_maxAngularVelocity;
                  }
                  else
                  {
                     _loc6_.m_angularVelocity = b2Settings.b2_maxAngularVelocity;
                  }
               }
            }
            _loc5_++;
         }
         _loc8_ = new b2ContactSolver(param1,this.m_contacts,this.m_contactCount,this.m_allocator);
         _loc8_.InitVelocityConstraints(param1);
         _loc5_ = int(0);
         while(_loc5_ < this.m_jointCount)
         {
            _loc7_ = this.m_joints[_loc5_];
            _loc7_.InitVelocityConstraints(param1);
            _loc5_++;
         }
         _loc5_ = int(0);
         while(_loc5_ < param1.maxIterations)
         {
            _loc8_.SolveVelocityConstraints();
            _loc9_ = int(0);
            while(_loc9_ < this.m_jointCount)
            {
               _loc7_ = this.m_joints[_loc9_];
               _loc7_.SolveVelocityConstraints(param1);
               _loc9_++;
            }
            _loc5_++;
         }
         _loc8_.FinalizeVelocityConstraints();
         _loc5_ = int(0);
         while(_loc5_ < this.m_bodyCount)
         {
            _loc6_ = this.m_bodies[_loc5_];
            if(!_loc6_.IsStatic())
            {
               _loc6_.m_sweep.c0.SetV(_loc6_.m_sweep.c);
               _loc6_.m_sweep.a0 = _loc6_.m_sweep.a;
               _loc6_.m_sweep.c.x += param1.dt * _loc6_.m_linearVelocity.x;
               _loc6_.m_sweep.c.y += param1.dt * _loc6_.m_linearVelocity.y;
               _loc6_.m_sweep.a += param1.dt * _loc6_.m_angularVelocity;
               _loc6_.SynchronizeTransform();
            }
            _loc5_++;
         }
         if(param3)
         {
            _loc5_ = int(0);
            while(_loc5_ < this.m_jointCount)
            {
               _loc7_ = this.m_joints[_loc5_];
               _loc7_.InitPositionConstraints();
               _loc5_++;
            }
            this.m_positionIterationCount = int(0);
            while(this.m_positionIterationCount < param1.maxIterations)
            {
               _loc10_ = _loc8_.SolvePositionConstraints(b2Settings.b2_contactBaumgarte);
               _loc11_ = true;
               _loc5_ = int(0);
               while(_loc5_ < this.m_jointCount)
               {
                  _loc7_ = this.m_joints[_loc5_];
                  _loc12_ = _loc7_.SolvePositionConstraints();
                  _loc11_ &&= _loc12_;
                  _loc5_++;
               }
               if(_loc10_ && _loc11_)
               {
                  break;
               }
               ++this.m_positionIterationCount;
            }
         }
         this.Report(_loc8_.m_constraints);
         if(param4)
         {
            _loc13_ = Number.MAX_VALUE;
            _loc14_ = b2Settings.b2_linearSleepTolerance * b2Settings.b2_linearSleepTolerance;
            _loc15_ = b2Settings.b2_angularSleepTolerance * b2Settings.b2_angularSleepTolerance;
            _loc5_ = int(0);
            while(_loc5_ < this.m_bodyCount)
            {
               _loc6_ = this.m_bodies[_loc5_];
               if(_loc6_.m_invMass != 0)
               {
                  if((_loc6_.m_flags & b2Body.e_allowSleepFlag) == 0)
                  {
                     _loc6_.m_sleepTime = 0;
                     _loc13_ = 0;
                  }
                  if((_loc6_.m_flags & b2Body.e_allowSleepFlag) == 0 || _loc6_.m_angularVelocity * _loc6_.m_angularVelocity > _loc15_ || b2Math.b2Dot(_loc6_.m_linearVelocity,_loc6_.m_linearVelocity) > _loc14_)
                  {
                     _loc6_.m_sleepTime = 0;
                     _loc13_ = 0;
                  }
                  else
                  {
                     _loc6_.m_sleepTime += param1.dt;
                     _loc13_ = b2Math.b2Min(_loc13_,_loc6_.m_sleepTime);
                  }
               }
               _loc5_++;
            }
            if(_loc13_ >= b2Settings.b2_timeToSleep)
            {
               _loc5_ = int(0);
               while(_loc5_ < this.m_bodyCount)
               {
                  _loc6_ = this.m_bodies[_loc5_];
                  _loc6_.m_flags |= b2Body.e_sleepFlag;
                  _loc6_.m_linearVelocity.SetZero();
                  _loc6_.m_angularVelocity = 0;
                  _loc5_++;
               }
            }
         }
      
}
AddContact(param1) {
         this.m_contacts[this.m_contactCount++] = param1;
      
}
Clear() {
         this.m_bodyCount = int(0);
         this.m_contactCount = int(0);
         this.m_jointCount = int(0);
      
}
SolveTOI(param1) {
         var _loc2_ = 0;
         var _loc3_ = null;
         var _loc4_ = NaN;
         var _loc5_ = null;
         var _loc6_ = false;
         _loc3_ = new b2ContactSolver(param1,this.m_contacts,this.m_contactCount,this.m_allocator);
         _loc2_ = int(0);
         while(_loc2_ < param1.maxIterations)
         {
            _loc3_.SolveVelocityConstraints();
            _loc2_++;
         }
         _loc2_ = int(0);
         while(_loc2_ < this.m_bodyCount)
         {
            _loc5_ = this.m_bodies[_loc2_];
            if(!_loc5_.IsStatic())
            {
               _loc5_.m_sweep.c0.SetV(_loc5_.m_sweep.c);
               _loc5_.m_sweep.a0 = _loc5_.m_sweep.a;
               _loc5_.m_sweep.c.x += param1.dt * _loc5_.m_linearVelocity.x;
               _loc5_.m_sweep.c.y += param1.dt * _loc5_.m_linearVelocity.y;
               _loc5_.m_sweep.a += param1.dt * _loc5_.m_angularVelocity;
               _loc5_.SynchronizeTransform();
            }
            _loc2_++;
         }
         _loc4_ = 0.75;
         _loc2_ = int(0);
         while(_loc2_ < param1.maxIterations)
         {
            _loc6_ = _loc3_.SolvePositionConstraints(_loc4_);
            if(_loc6_)
            {
               break;
            }
            _loc2_++;
         }
         this.Report(_loc3_.m_constraints);
      
}
}
class b2TimeStep {
warmStarting = false;
positionCorrection = false;
dt = NaN;
maxIterations = 0;
dtRatio = NaN;
inv_dt = NaN;
constructor() {
         
      
}
}
class b2World {
static m_continuousPhysics;
static m_warmStarting;
static m_positionCorrection;
static s_jointColor;
static s_coreColor;
static s_xf;
m_inv_dt0 = NaN;
m_boundaryListener = null;
m_contactList = null;
m_blockAllocator = null;
m_contactListener = null;
m_allowSleep = false;
m_broadPhase = null;
m_destructionListener = null;
m_jointCount = 0;
m_bodyCount = 0;
m_lock = false;
m_positionIterationCount = 0;
m_groundBody = null;
m_contactCount = 0;
m_debugDraw = null;
m_contactFilter = null;
m_bodyList = null;
m_stackAllocator = null;
m_jointList = null;
m_gravity = null;
m_contactManager = new b2ContactManager();
constructor(param1, param2, param3) {
         var _loc4_ = null;
         
         this.m_destructionListener = null;
         this.m_boundaryListener = null;
         this.m_contactFilter = b2ContactFilter.b2_defaultFilter;
         this.m_contactListener = null;
         this.m_debugDraw = null;
         this.m_bodyList = null;
         this.m_contactList = null;
         this.m_jointList = null;
         this.m_bodyCount = int(0);
         this.m_contactCount = int(0);
         this.m_jointCount = int(0);
         b2World.m_positionCorrection = true;
         b2World.m_warmStarting = true;
         b2World.m_continuousPhysics = true;
         this.m_allowSleep = param3;
         this.m_gravity = param2;
         this.m_lock = false;
         this.m_inv_dt0 = 0;
         this.m_contactManager.m_world = this;
         this.m_broadPhase = new b2BroadPhase(param1,this.m_contactManager);
         _loc4_ = new b2BodyDef();
         this.m_groundBody = this.CreateBody(_loc4_);
      
}
DrawJoint(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = null;
         var _loc10_ = null;
         var _loc11_ = null;
         var _loc12_ = null;
         var _loc13_ = null;
         _loc2_ = param1.m_body1;
         _loc3_ = param1.m_body2;
         _loc4_ = _loc2_.m_xf;
         _loc5_ = _loc3_.m_xf;
         _loc6_ = _loc4_.position;
         _loc7_ = _loc5_.position;
         _loc8_ = param1.GetAnchor1();
         _loc9_ = param1.GetAnchor2();
         _loc10_ = b2World.s_jointColor;
         switch(param1.m_type)
         {
            case b2Joint.e_distanceJoint:
               this.m_debugDraw.DrawSegment(_loc8_,_loc9_,_loc10_);
               break;
            case b2Joint.e_pulleyJoint:
               _loc11_ = param1;
               _loc12_ = _loc11_.GetGroundAnchor1();
               _loc13_ = _loc11_.GetGroundAnchor2();
               this.m_debugDraw.DrawSegment(_loc12_,_loc8_,_loc10_);
               this.m_debugDraw.DrawSegment(_loc13_,_loc9_,_loc10_);
               this.m_debugDraw.DrawSegment(_loc12_,_loc13_,_loc10_);
               break;
            case b2Joint.e_mouseJoint:
               this.m_debugDraw.DrawSegment(_loc8_,_loc9_,_loc10_);
               break;
            default:
               if(_loc2_ != this.m_groundBody)
               {
                  this.m_debugDraw.DrawSegment(_loc6_,_loc8_,_loc10_);
               }
               this.m_debugDraw.DrawSegment(_loc8_,_loc9_,_loc10_);
               if(_loc3_ != this.m_groundBody)
               {
                  this.m_debugDraw.DrawSegment(_loc7_,_loc9_,_loc10_);
               }
         }
      
}
Refilter(param1) {
         param1.RefilterProxy(this.m_broadPhase,param1.m_body.m_xf);
      
}
SetDebugDraw(param1) {
         this.m_debugDraw = param1;
      
}
SetContinuousPhysics(param1) {
         b2World.m_continuousPhysics = param1;
      
}
GetProxyCount() {
         return this.m_broadPhase.m_proxyCount;
      
}
DrawDebugData() {
         var _loc1_ = 0;
         var _loc2_ = 0;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = null;
         var _loc10_ = null;
         var _loc11_ = null;
         var _loc12_ = null;
         var _loc13_ = null;
         var _loc14_ = null;
         var _loc15_ = false;
         var _loc16_ = 0;
         var _loc17_ = null;
         var _loc18_ = null;
         var _loc19_ = null;
         var _loc20_ = null;
         var _loc21_ = null;
         var _loc22_ = null;
         var _loc23_ = null;
         var _loc24_ = null;
         var _loc25_ = null;
         var _loc26_ = null;
         var _loc27_ = null;
         var _loc28_ = NaN;
         if(this.m_debugDraw == null)
         {
            return;
         }
         this.m_debugDraw.m_sprite.graphics.clear();
         _loc1_ = uint(this.m_debugDraw.GetFlags());
         _loc7_ = new b2Vec2();
         _loc8_ = new b2Vec2();
         _loc9_ = new b2Vec2();
         _loc10_ = new b2Color(0,0,0);
         _loc12_ = new b2AABB();
         _loc13_ = new b2AABB();
         _loc14_ = [new b2Vec2(),new b2Vec2(),new b2Vec2(),new b2Vec2()];
         if(_loc1_ & b2DebugDraw.e_shapeBit)
         {
            _loc15_ = (_loc1_ & b2DebugDraw.e_coreShapeBit) == b2DebugDraw.e_coreShapeBit;
            _loc3_ = this.m_bodyList;
            while(_loc3_)
            {
               _loc11_ = _loc3_.m_xf;
               _loc4_ = _loc3_.GetShapeList();
               while(_loc4_)
               {
                  if(_loc3_.IsStatic())
                  {
                     this.DrawShape(_loc4_,_loc11_,new b2Color(0.5,0.9,0.5),_loc15_);
                  }
                  else if(_loc3_.IsSleeping())
                  {
                     this.DrawShape(_loc4_,_loc11_,new b2Color(0.5,0.5,0.9),_loc15_);
                  }
                  else
                  {
                     this.DrawShape(_loc4_,_loc11_,new b2Color(0.9,0.9,0.9),_loc15_);
                  }
                  _loc4_ = _loc4_.m_next;
               }
               _loc3_ = _loc3_.m_next;
            }
         }
         if(_loc1_ & b2DebugDraw.e_jointBit)
         {
            _loc5_ = this.m_jointList;
            while(_loc5_)
            {
               this.DrawJoint(_loc5_);
               _loc5_ = _loc5_.m_next;
            }
         }
         if(_loc1_ & b2DebugDraw.e_pairBit)
         {
            _loc6_ = this.m_broadPhase;
            _loc7_.Set(1 / _loc6_.m_quantizationFactor.x,1 / _loc6_.m_quantizationFactor.y);
            _loc10_.Set(0.9,0.9,0.3);
            _loc2_ = int(0);
            while(_loc2_ < b2Pair.b2_tableCapacity)
            {
               _loc16_ = uint(uint(_loc6_.m_pairManager.m_hashTable[_loc2_]));
               while(_loc16_ != b2Pair.b2_nullPair)
               {
                  _loc17_ = _loc6_.m_pairManager.m_pairs[_loc16_];
                  _loc18_ = _loc6_.m_proxyPool[_loc17_.proxyId1];
                  _loc19_ = _loc6_.m_proxyPool[_loc17_.proxyId2];
                  _loc12_.lowerBound.x = _loc6_.m_worldAABB.lowerBound.x + _loc7_.x * _loc6_.m_bounds[0][_loc18_.lowerBounds[0]].value;
                  _loc12_.lowerBound.y = _loc6_.m_worldAABB.lowerBound.y + _loc7_.y * _loc6_.m_bounds[1][_loc18_.lowerBounds[1]].value;
                  _loc12_.upperBound.x = _loc6_.m_worldAABB.lowerBound.x + _loc7_.x * _loc6_.m_bounds[0][_loc18_.upperBounds[0]].value;
                  _loc12_.upperBound.y = _loc6_.m_worldAABB.lowerBound.y + _loc7_.y * _loc6_.m_bounds[1][_loc18_.upperBounds[1]].value;
                  _loc13_.lowerBound.x = _loc6_.m_worldAABB.lowerBound.x + _loc7_.x * _loc6_.m_bounds[0][_loc19_.lowerBounds[0]].value;
                  _loc13_.lowerBound.y = _loc6_.m_worldAABB.lowerBound.y + _loc7_.y * _loc6_.m_bounds[1][_loc19_.lowerBounds[1]].value;
                  _loc13_.upperBound.x = _loc6_.m_worldAABB.lowerBound.x + _loc7_.x * _loc6_.m_bounds[0][_loc19_.upperBounds[0]].value;
                  _loc13_.upperBound.y = _loc6_.m_worldAABB.lowerBound.y + _loc7_.y * _loc6_.m_bounds[1][_loc19_.upperBounds[1]].value;
                  _loc8_.x = 0.5 * (_loc12_.lowerBound.x + _loc12_.upperBound.x);
                  _loc8_.y = 0.5 * (_loc12_.lowerBound.y + _loc12_.upperBound.y);
                  _loc9_.x = 0.5 * (_loc13_.lowerBound.x + _loc13_.upperBound.x);
                  _loc9_.y = 0.5 * (_loc13_.lowerBound.y + _loc13_.upperBound.y);
                  this.m_debugDraw.DrawSegment(_loc8_,_loc9_,_loc10_);
                  _loc16_ = uint(_loc17_.next);
               }
               _loc2_++;
            }
         }
         if(_loc1_ & b2DebugDraw.e_aabbBit)
         {
            _loc6_ = this.m_broadPhase;
            _loc20_ = _loc6_.m_worldAABB.lowerBound;
            _loc21_ = _loc6_.m_worldAABB.upperBound;
            _loc7_.Set(1 / _loc6_.m_quantizationFactor.x,1 / _loc6_.m_quantizationFactor.y);
            _loc10_.Set(0.9,0.3,0.9);
            _loc2_ = int(0);
            while(_loc2_ < b2Settings.b2_maxProxies)
            {
               _loc22_ = _loc6_.m_proxyPool[_loc2_];
               if(_loc22_.IsValid() != false)
               {
                  _loc12_.lowerBound.x = _loc20_.x + _loc7_.x * _loc6_.m_bounds[0][_loc22_.lowerBounds[0]].value;
                  _loc12_.lowerBound.y = _loc20_.y + _loc7_.y * _loc6_.m_bounds[1][_loc22_.lowerBounds[1]].value;
                  _loc12_.upperBound.x = _loc20_.x + _loc7_.x * _loc6_.m_bounds[0][_loc22_.upperBounds[0]].value;
                  _loc12_.upperBound.y = _loc20_.y + _loc7_.y * _loc6_.m_bounds[1][_loc22_.upperBounds[1]].value;
                  _loc14_[0].Set(_loc12_.lowerBound.x,_loc12_.lowerBound.y);
                  _loc14_[1].Set(_loc12_.upperBound.x,_loc12_.lowerBound.y);
                  _loc14_[2].Set(_loc12_.upperBound.x,_loc12_.upperBound.y);
                  _loc14_[3].Set(_loc12_.lowerBound.x,_loc12_.upperBound.y);
                  this.m_debugDraw.DrawPolygon(_loc14_,4,_loc10_);
               }
               _loc2_++;
            }
            _loc14_[0].Set(_loc20_.x,_loc20_.y);
            _loc14_[1].Set(_loc21_.x,_loc20_.y);
            _loc14_[2].Set(_loc21_.x,_loc21_.y);
            _loc14_[3].Set(_loc20_.x,_loc21_.y);
            this.m_debugDraw.DrawPolygon(_loc14_,4,new b2Color(0.3,0.9,0.9));
         }
         if(_loc1_ & b2DebugDraw.e_obbBit)
         {
            _loc10_.Set(0.5,0.3,0.5);
            _loc3_ = this.m_bodyList;
            while(_loc3_)
            {
               _loc11_ = _loc3_.m_xf;
               _loc4_ = _loc3_.GetShapeList();
               while(_loc4_)
               {
                  if(_loc4_.m_type == b2Shape.e_polygonShape)
                  {
                     _loc23_ = _loc4_;
                     _loc24_ = _loc23_.GetOBB();
                     _loc25_ = _loc24_.extents;
                     _loc14_[0].Set(-_loc25_.x,-_loc25_.y);
                     _loc14_[1].Set(_loc25_.x,-_loc25_.y);
                     _loc14_[2].Set(_loc25_.x,_loc25_.y);
                     _loc14_[3].Set(-_loc25_.x,_loc25_.y);
                     _loc2_ = int(0);
                     while(_loc2_ < 4)
                     {
                        _loc26_ = _loc24_.R;
                        _loc27_ = _loc14_[_loc2_];
                        _loc28_ = _loc24_.center.x + (_loc26_.col1.x * _loc27_.x + _loc26_.col2.x * _loc27_.y);
                        _loc14_[_loc2_].y = _loc24_.center.y + (_loc26_.col1.y * _loc27_.x + _loc26_.col2.y * _loc27_.y);
                        _loc14_[_loc2_].x = _loc28_;
                        _loc26_ = _loc11_.R;
                        _loc28_ = _loc11_.position.x + (_loc26_.col1.x * _loc27_.x + _loc26_.col2.x * _loc27_.y);
                        _loc14_[_loc2_].y = _loc11_.position.y + (_loc26_.col1.y * _loc27_.x + _loc26_.col2.y * _loc27_.y);
                        _loc14_[_loc2_].x = _loc28_;
                        _loc2_++;
                     }
                     this.m_debugDraw.DrawPolygon(_loc14_,4,_loc10_);
                  }
                  _loc4_ = _loc4_.m_next;
               }
               _loc3_ = _loc3_.m_next;
            }
         }
         if(_loc1_ & b2DebugDraw.e_centerOfMassBit)
         {
            _loc3_ = this.m_bodyList;
            while(_loc3_)
            {
               _loc11_ = b2World.s_xf;
               _loc11_.R = _loc3_.m_xf.R;
               _loc11_.position = _loc3_.GetWorldCenter();
               this.m_debugDraw.DrawXForm(_loc11_);
               _loc3_ = _loc3_.m_next;
            }
         }
      
}
DestroyBody(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         if(this.m_lock == true)
         {
            return;
         }
         _loc2_ = param1.m_jointList;
         while(_loc2_)
         {
            _loc4_ = _loc2_;
            _loc2_ = _loc2_.next;
            if(this.m_destructionListener)
            {
               this.m_destructionListener.SayGoodbyeJoint(_loc4_.joint);
            }
            this.DestroyJoint(_loc4_.joint);
         }
         _loc3_ = param1.m_shapeList;
         while(_loc3_)
         {
            _loc5_ = _loc3_;
            _loc3_ = _loc3_.m_next;
            if(this.m_destructionListener)
            {
               this.m_destructionListener.SayGoodbyeShape(_loc5_);
            }
            _loc5_.DestroyProxy(this.m_broadPhase);
            b2Shape.Destroy(_loc5_,this.m_blockAllocator);
         }
         if(param1.m_prev)
         {
            param1.m_prev.m_next = param1.m_next;
         }
         if(param1.m_next)
         {
            param1.m_next.m_prev = param1.m_prev;
         }
         if(param1 == this.m_bodyList)
         {
            this.m_bodyList = param1.m_next;
         }
         --this.m_bodyCount;
      
}
SetContactFilter(param1) {
         this.m_contactFilter = param1;
      
}
GetGroundBody() {
         return this.m_groundBody;
      
}
DrawShape(param1, param2, param3, param4) {
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = NaN;
         var _loc9_ = null;
         var _loc10_ = 0;
         var _loc11_ = null;
         var _loc12_ = 0;
         var _loc13_ = null;
         var _loc14_ = null;
         var _loc15_ = null;
         _loc5_ = b2World.s_coreColor;
         switch(param1.m_type)
         {
            case b2Shape.e_circleShape:
               _loc6_ = param1;
               _loc7_ = b2Math.b2MulX(param2,_loc6_.m_localPosition);
               _loc8_ = _loc6_.m_radius;
               _loc9_ = param2.R.col1;
               this.m_debugDraw.DrawSolidCircle(_loc7_,_loc8_,_loc9_,param3);
               if(param4)
               {
                  this.m_debugDraw.DrawCircle(_loc7_,_loc8_ - b2Settings.b2_toiSlop,_loc5_);
               }
               break;
            case b2Shape.e_polygonShape:
               _loc11_ = param1;
               _loc12_ = int(_loc11_.GetVertexCount());
               _loc13_ = _loc11_.GetVertices();
               _loc14_ = new Array(b2Settings.b2_maxPolygonVertices);
               _loc10_ = int(0);
               while(_loc10_ < _loc12_)
               {
                  _loc14_[_loc10_] = b2Math.b2MulX(param2,_loc13_[_loc10_]);
                  _loc10_++;
               }
               this.m_debugDraw.DrawSolidPolygon(_loc14_,_loc12_,param3);
               if(param4)
               {
                  _loc15_ = _loc11_.GetCoreVertices();
                  _loc10_ = int(0);
                  while(_loc10_ < _loc12_)
                  {
                     _loc14_[_loc10_] = b2Math.b2MulX(param2,_loc15_[_loc10_]);
                     _loc10_++;
                  }
                  this.m_debugDraw.DrawPolygon(_loc14_,_loc12_,_loc5_);
               }
         }
      
}
GetContactCount() {
         return this.m_contactCount;
      
}
Solve(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = 0;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = 0;
         var _loc10_ = 0;
         var _loc11_ = null;
         var _loc12_ = null;
         var _loc13_ = null;
         var _loc14_ = false;
         this.m_positionIterationCount = int(0);
         _loc3_ = new b2Island(this.m_bodyCount,this.m_contactCount,this.m_jointCount,this.m_stackAllocator,this.m_contactListener);
         _loc2_ = this.m_bodyList;
         while(_loc2_)
         {
            _loc2_.m_flags &= ~b2Body.e_islandFlag;
            _loc2_ = _loc2_.m_next;
         }
         _loc4_ = this.m_contactList;
         while(_loc4_)
         {
            _loc4_.m_flags &= ~b2Contact.e_islandFlag;
            _loc4_ = _loc4_.m_next;
         }
         _loc5_ = this.m_jointList;
         while(_loc5_)
         {
            _loc5_.m_islandFlag = false;
            _loc5_ = _loc5_.m_next;
         }
         _loc6_ = int(this.m_bodyCount);
         _loc7_ = new Array(_loc6_);
         _loc8_ = this.m_bodyList;
         while(_loc8_)
         {
            if(!(_loc8_.m_flags & (b2Body.e_islandFlag | b2Body.e_sleepFlag | b2Body.e_frozenFlag)))
            {
               if(!_loc8_.IsStatic())
               {
                  _loc3_.Clear();
                  _loc9_ = 0;
                  var _loc15_;
                  _loc7_[_loc15_ = _loc9_++] = _loc8_;
                  _loc8_.m_flags |= b2Body.e_islandFlag;
                  while(_loc9_ > 0)
                  {
                     _loc2_ = _loc7_[--_loc9_];
                     _loc3_.AddBody(_loc2_);
                     _loc2_.m_flags &= ~b2Body.e_sleepFlag;
                     if(!_loc2_.IsStatic())
                     {
                        _loc12_ = _loc2_.m_contactList;
                        while(_loc12_)
                        {
                           if(!(_loc12_.contact.m_flags & (b2Contact.e_islandFlag | b2Contact.e_nonSolidFlag)))
                           {
                              if(_loc12_.contact.m_manifoldCount != 0)
                              {
                                 _loc3_.AddContact(_loc12_.contact);
                                 _loc12_.contact.m_flags |= b2Contact.e_islandFlag;
                                 _loc11_ = _loc12_.other;
                                 if(!(_loc11_.m_flags & b2Body.e_islandFlag))
                                 {
                                    var _loc16_;
                                    _loc7_[_loc16_ = _loc9_++] = _loc11_;
                                    _loc11_.m_flags |= b2Body.e_islandFlag;
                                 }
                              }
                           }
                           _loc12_ = _loc12_.next;
                        }
                        _loc13_ = _loc2_.m_jointList;
                        while(_loc13_)
                        {
                           if(_loc13_.joint.m_islandFlag != true)
                           {
                              _loc3_.AddJoint(_loc13_.joint);
                              _loc13_.joint.m_islandFlag = true;
                              _loc11_ = _loc13_.other;
                              if(!(_loc11_.m_flags & b2Body.e_islandFlag))
                              {
                                 _loc7_[_loc16_ = _loc9_++] = _loc11_;
                                 _loc11_.m_flags |= b2Body.e_islandFlag;
                              }
                           }
                           _loc13_ = _loc13_.next;
                        }
                     }
                  }
                  _loc3_.Solve(param1,this.m_gravity,b2World.m_positionCorrection,this.m_allowSleep);
                  if(_loc3_.m_positionIterationCount > this.m_positionIterationCount)
                  {
                     this.m_positionIterationCount = int(_loc3_.m_positionIterationCount);
                  }
                  _loc10_ = int(0);
                  while(_loc10_ < _loc3_.m_bodyCount)
                  {
                     _loc2_ = _loc3_.m_bodies[_loc10_];
                     if(_loc2_.IsStatic())
                     {
                        _loc2_.m_flags &= ~b2Body.e_islandFlag;
                     }
                     _loc10_++;
                  }
               }
            }
            _loc8_ = _loc8_.m_next;
         }
         _loc2_ = this.m_bodyList;
         while(_loc2_)
         {
            if(!(_loc2_.m_flags & (b2Body.e_sleepFlag | b2Body.e_frozenFlag)))
            {
               if(!_loc2_.IsStatic())
               {
                  _loc14_ = _loc2_.SynchronizeShapes();
                  if(_loc14_ == false && this.m_boundaryListener != null)
                  {
                     this.m_boundaryListener.Violation(_loc2_);
                  }
               }
            }
            _loc2_ = _loc2_.m_next;
         }
         this.m_broadPhase.Commit();
      
}
Query(param1, param2, param3) {param3=int(param3);
         var _loc4_ = null;
         var _loc5_ = 0;
         var _loc6_ = 0;
         _loc4_ = new Array(param3);
         _loc5_ = int(this.m_broadPhase.QueryAABB(param1,_loc4_,param3));
         _loc6_ = int(0);
         while(_loc6_ < _loc5_)
         {
            param2[_loc6_] = _loc4_[_loc6_];
            _loc6_++;
         }
         return _loc5_;
      
}
SetGravity(param1) {
         this.m_gravity = param1;
      
}
SolveTOI(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = 0;
         var _loc10_ = null;
         var _loc11_ = null;
         var _loc12_ = null;
         var _loc13_ = NaN;
         var _loc14_ = null;
         var _loc15_ = 0;
         var _loc16_ = null;
         var _loc17_ = 0;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = null;
         var _loc21_ = false;
         _loc8_ = new b2Island(this.m_bodyCount,b2Settings.b2_maxTOIContactsPerIsland,0,this.m_stackAllocator,this.m_contactListener);
         _loc9_ = int(this.m_bodyCount);
         _loc10_ = new Array(_loc9_);
         _loc2_ = this.m_bodyList;
         while(_loc2_)
         {
            _loc2_.m_flags &= ~b2Body.e_islandFlag;
            _loc2_.m_sweep.t0 = 0;
            _loc2_ = _loc2_.m_next;
         }
         _loc11_ = this.m_contactList;
         while(_loc11_)
         {
            _loc11_.m_flags &= ~(b2Contact.e_toiFlag | b2Contact.e_islandFlag);
            _loc11_ = _loc11_.m_next;
         }
         while(true)
         {
            _loc12_ = null;
            _loc13_ = 1;
            _loc11_ = this.m_contactList;
            for(; _loc11_; _loc11_ = _loc11_.m_next)
            {
               if(!(_loc11_.m_flags & (b2Contact.e_slowFlag | b2Contact.e_nonSolidFlag)))
               {
                  _loc18_ = 1;
                  if(_loc11_.m_flags & b2Contact.e_toiFlag)
                  {
                     _loc18_ = _loc11_.m_toi;
                  }
                  else
                  {
                     _loc3_ = _loc11_.m_shape1;
                     _loc4_ = _loc11_.m_shape2;
                     _loc5_ = _loc3_.m_body;
                     _loc6_ = _loc4_.m_body;
                     if((_loc5_.IsStatic() || _loc5_.IsSleeping()) && (_loc6_.IsStatic() || _loc6_.IsSleeping()))
                     {
                        continue;
                     }
                     _loc19_ = _loc5_.m_sweep.t0;
                     if(_loc5_.m_sweep.t0 < _loc6_.m_sweep.t0)
                     {
                        _loc19_ = _loc6_.m_sweep.t0;
                        _loc5_.m_sweep.Advance(_loc19_);
                     }
                     else if(_loc6_.m_sweep.t0 < _loc5_.m_sweep.t0)
                     {
                        _loc19_ = _loc5_.m_sweep.t0;
                        _loc6_.m_sweep.Advance(_loc19_);
                     }
                     _loc18_ = b2TimeOfImpact.TimeOfImpact(_loc11_.m_shape1,_loc5_.m_sweep,_loc11_.m_shape2,_loc6_.m_sweep);
                     if(_loc18_ > 0 && _loc18_ < 1)
                     {
                        _loc18_ = (1 - _loc18_) * _loc19_ + _loc18_;
                        if(_loc18_ > 1)
                        {
                           _loc18_ = 1;
                        }
                     }
                     _loc11_.m_toi = _loc18_;
                     _loc11_.m_flags |= b2Contact.e_toiFlag;
                  }
                  if(Number.MIN_VALUE < _loc18_ && _loc18_ < _loc13_)
                  {
                     _loc12_ = _loc11_;
                     _loc13_ = _loc18_;
                  }
               }
            }
            if(_loc12_ == null || 1 - 100 * Number.MIN_VALUE < _loc13_)
            {
               break;
            }
            _loc3_ = _loc12_.m_shape1;
            _loc4_ = _loc12_.m_shape2;
            _loc5_ = _loc3_.m_body;
            _loc6_ = _loc4_.m_body;
            _loc5_.Advance(_loc13_);
            _loc6_.Advance(_loc13_);
            _loc12_.Update(this.m_contactListener);
            _loc12_.m_flags &= ~b2Contact.e_toiFlag;
            if(_loc12_.m_manifoldCount != 0)
            {
               _loc14_ = _loc5_;
               if(_loc14_.IsStatic())
               {
                  _loc14_ = _loc6_;
               }
               _loc8_.Clear();
               _loc15_ = 0;
               var _loc22_;
               _loc10_[_loc22_ = _loc15_++] = _loc14_;
               _loc14_.m_flags |= b2Body.e_islandFlag;
               while(_loc15_ > 0)
               {
                  _loc2_ = _loc10_[--_loc15_];
                  _loc8_.AddBody(_loc2_);
                  _loc2_.m_flags &= ~b2Body.e_sleepFlag;
                  if(!_loc2_.IsStatic())
                  {
                     _loc7_ = _loc2_.m_contactList;
                     while(_loc7_)
                     {
                        if(_loc8_.m_contactCount != _loc8_.m_contactCapacity)
                        {
                           if(!(_loc7_.contact.m_flags & (b2Contact.e_islandFlag | b2Contact.e_slowFlag | b2Contact.e_nonSolidFlag)))
                           {
                              if(_loc7_.contact.m_manifoldCount != 0)
                              {
                                 _loc8_.AddContact(_loc7_.contact);
                                 _loc7_.contact.m_flags |= b2Contact.e_islandFlag;
                                 _loc20_ = _loc7_.other;
                                 if(!(_loc20_.m_flags & b2Body.e_islandFlag))
                                 {
                                    if(_loc20_.IsStatic() == false)
                                    {
                                       _loc20_.Advance(_loc13_);
                                       _loc20_.WakeUp();
                                    }
                                    var _loc23_;
                                    _loc10_[_loc23_ = _loc15_++] = _loc20_;
                                    _loc20_.m_flags |= b2Body.e_islandFlag;
                                 }
                              }
                           }
                        }
                        _loc7_ = _loc7_.next;
                     }
                  }
               }
               _loc16_ = new b2TimeStep();
               _loc16_.dt = (1 - _loc13_) * param1.dt;
               _loc16_.inv_dt = 1 / _loc16_.dt;
               _loc16_.maxIterations = param1.maxIterations;
               _loc8_.SolveTOI(_loc16_);
               _loc17_ = int(0);
               while(_loc17_ < _loc8_.m_bodyCount)
               {
                  _loc2_ = _loc8_.m_bodies[_loc17_];
                  _loc2_.m_flags &= ~b2Body.e_islandFlag;
                  if(!(_loc2_.m_flags & (b2Body.e_sleepFlag | b2Body.e_frozenFlag)))
                  {
                     if(!_loc2_.IsStatic())
                     {
                        _loc21_ = _loc2_.SynchronizeShapes();
                        if(_loc21_ == false && this.m_boundaryListener != null)
                        {
                           this.m_boundaryListener.Violation(_loc2_);
                        }
                        _loc7_ = _loc2_.m_contactList;
                        while(_loc7_)
                        {
                           _loc7_.contact.m_flags &= ~b2Contact.e_toiFlag;
                           _loc7_ = _loc7_.next;
                        }
                     }
                  }
                  _loc17_++;
               }
               _loc17_ = int(0);
               while(_loc17_ < _loc8_.m_contactCount)
               {
                  _loc11_ = _loc8_.m_contacts[_loc17_];
                  _loc11_.m_flags &= ~(b2Contact.e_toiFlag | b2Contact.e_islandFlag);
                  _loc17_++;
               }
               this.m_broadPhase.Commit();
            }
         }
      
}
GetJointList() {
         return this.m_jointList;
      
}
Validate() {
         this.m_broadPhase.Validate();
      
}
GetPairCount() {
         return this.m_broadPhase.m_pairManager.m_pairCount;
      
}
GetBodyList() {
         return this.m_bodyList;
      
}
SetWarmStarting(param1) {
         b2World.m_warmStarting = param1;
      
}
SetPositionCorrection(param1) {
         b2World.m_positionCorrection = param1;
      
}
CreateJoint(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         _loc2_ = b2Joint.Create(param1,this.m_blockAllocator);
         _loc2_.m_prev = null;
         _loc2_.m_next = this.m_jointList;
         if(this.m_jointList)
         {
            this.m_jointList.m_prev = _loc2_;
         }
         this.m_jointList = _loc2_;
         ++this.m_jointCount;
         _loc2_.m_node1.joint = _loc2_;
         _loc2_.m_node1.other = _loc2_.m_body2;
         _loc2_.m_node1.prev = null;
         _loc2_.m_node1.next = _loc2_.m_body1.m_jointList;
         if(_loc2_.m_body1.m_jointList)
         {
            _loc2_.m_body1.m_jointList.prev = _loc2_.m_node1;
         }
         _loc2_.m_body1.m_jointList = _loc2_.m_node1;
         _loc2_.m_node2.joint = _loc2_;
         _loc2_.m_node2.other = _loc2_.m_body1;
         _loc2_.m_node2.prev = null;
         _loc2_.m_node2.next = _loc2_.m_body2.m_jointList;
         if(_loc2_.m_body2.m_jointList)
         {
            _loc2_.m_body2.m_jointList.prev = _loc2_.m_node2;
         }
         _loc2_.m_body2.m_jointList = _loc2_.m_node2;
         if(param1.collideConnected == false)
         {
            _loc3_ = param1.body1.m_shapeCount < param1.body2.m_shapeCount ? param1.body1 : param1.body2;
            _loc4_ = _loc3_.m_shapeList;
            while(_loc4_)
            {
               _loc4_.RefilterProxy(this.m_broadPhase,_loc3_.m_xf);
               _loc4_ = _loc4_.m_next;
            }
         }
         return _loc2_;
      
}
DestroyJoint(param1) {
         var _loc2_ = false;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = null;
         _loc2_ = param1.m_collideConnected;
         if(param1.m_prev)
         {
            param1.m_prev.m_next = param1.m_next;
         }
         if(param1.m_next)
         {
            param1.m_next.m_prev = param1.m_prev;
         }
         if(param1 == this.m_jointList)
         {
            this.m_jointList = param1.m_next;
         }
         _loc3_ = param1.m_body1;
         _loc4_ = param1.m_body2;
         _loc3_.WakeUp();
         _loc4_.WakeUp();
         if(param1.m_node1.prev)
         {
            param1.m_node1.prev.next = param1.m_node1.next;
         }
         if(param1.m_node1.next)
         {
            param1.m_node1.next.prev = param1.m_node1.prev;
         }
         if(param1.m_node1 == _loc3_.m_jointList)
         {
            _loc3_.m_jointList = param1.m_node1.next;
         }
         param1.m_node1.prev = null;
         param1.m_node1.next = null;
         if(param1.m_node2.prev)
         {
            param1.m_node2.prev.next = param1.m_node2.next;
         }
         if(param1.m_node2.next)
         {
            param1.m_node2.next.prev = param1.m_node2.prev;
         }
         if(param1.m_node2 == _loc4_.m_jointList)
         {
            _loc4_.m_jointList = param1.m_node2.next;
         }
         param1.m_node2.prev = null;
         param1.m_node2.next = null;
         b2Joint.Destroy(param1,this.m_blockAllocator);
         --this.m_jointCount;
         if(_loc2_ == false)
         {
            _loc5_ = _loc3_.m_shapeCount < _loc4_.m_shapeCount ? _loc3_ : _loc4_;
            _loc6_ = _loc5_.m_shapeList;
            while(_loc6_)
            {
               _loc6_.RefilterProxy(this.m_broadPhase,_loc5_.m_xf);
               _loc6_ = _loc6_.m_next;
            }
         }
      
}
SetContactListener(param1) {
         this.m_contactListener = param1;
      
}
CreateBody(param1) {
         var _loc2_ = null;
         if(this.m_lock == true)
         {
            return null;
         }
         _loc2_ = new b2Body(param1,this);
         _loc2_.m_prev = null;
         _loc2_.m_next = this.m_bodyList;
         if(this.m_bodyList)
         {
            this.m_bodyList.m_prev = _loc2_;
         }
         this.m_bodyList = _loc2_;
         ++this.m_bodyCount;
         return _loc2_;
      
}
SetBoundaryListener(param1) {
         this.m_boundaryListener = param1;
      
}
SetDestructionListener(param1) {
         this.m_destructionListener = param1;
      
}
Step(param1, param2) {param2=int(param2);
         var _loc3_ = null;
         this.m_lock = true;
         _loc3_ = new b2TimeStep();
         _loc3_.dt = param1;
         _loc3_.maxIterations = param2;
         if(param1 > 0)
         {
            _loc3_.inv_dt = 1 / param1;
         }
         else
         {
            _loc3_.inv_dt = 0;
         }
         _loc3_.dtRatio = this.m_inv_dt0 * param1;
         _loc3_.positionCorrection = b2World.m_positionCorrection;
         _loc3_.warmStarting = b2World.m_warmStarting;
         this.m_contactManager.Collide();
         if(_loc3_.dt > 0)
         {
            this.Solve(_loc3_);
         }
         if(b2World.m_continuousPhysics && _loc3_.dt > 0)
         {
            this.SolveTOI(_loc3_);
         }
         this.DrawDebugData();
         this.m_inv_dt0 = _loc3_.inv_dt;
         this.m_lock = false;
      
}
GetBodyCount() {
         return this.m_bodyCount;
      
}
GetJointCount() {
         return this.m_jointCount;
      
}
}
class b2CircleDef extends b2ShapeDef {
localPosition = new b2Vec2(0,0);
radius = NaN;
constructor() {
         super();
         this.type = b2Shape.e_circleShape;
         this.radius = 1;
      
}
}
class b2CircleShape extends b2Shape {
m_radius = NaN;
m_localPosition = new b2Vec2();
constructor(param1) {
         var _loc2_ = null;
         super(param1);
         _loc2_ = param1;
         this.m_type = b2Shape.e_circleShape;
         this.m_localPosition.SetV(_loc2_.localPosition);
         this.m_radius = _loc2_.radius;
      
}
TestPoint(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         _loc3_ = param1.R;
         _loc4_ = param1.position.x + (_loc3_.col1.x * this.m_localPosition.x + _loc3_.col2.x * this.m_localPosition.y);
         _loc5_ = param1.position.y + (_loc3_.col1.y * this.m_localPosition.x + _loc3_.col2.y * this.m_localPosition.y);
         _loc4_ = param2.x - _loc4_;
         _loc5_ = param2.y - _loc5_;
         return _loc4_ * _loc4_ + _loc5_ * _loc5_ <= this.m_radius * this.m_radius;
      
}
GetLocalPosition() {
         return this.m_localPosition;
      
}
TestSegment(param1, param2, param3, param4, param5) {
         var _loc6_ = null;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         _loc6_ = param1.R;
         _loc7_ = param1.position.x + (_loc6_.col1.x * this.m_localPosition.x + _loc6_.col2.x * this.m_localPosition.y);
         _loc8_ = param1.position.y + (_loc6_.col1.y * this.m_localPosition.x + _loc6_.col2.y * this.m_localPosition.y);
         _loc9_ = param4.p1.x - _loc7_;
         _loc10_ = param4.p1.y - _loc8_;
         _loc11_ = _loc9_ * _loc9_ + _loc10_ * _loc10_ - this.m_radius * this.m_radius;
         if(_loc11_ < 0)
         {
            return false;
         }
         _loc12_ = param4.p2.x - param4.p1.x;
         _loc13_ = param4.p2.y - param4.p1.y;
         _loc14_ = _loc9_ * _loc12_ + _loc10_ * _loc13_;
         _loc15_ = _loc12_ * _loc12_ + _loc13_ * _loc13_;
         _loc16_ = _loc14_ * _loc14_ - _loc15_ * _loc11_;
         if(_loc16_ < 0 || _loc15_ < Number.MIN_VALUE)
         {
            return false;
         }
         _loc17_ = -(_loc14_ + Math.sqrt(_loc16_));
         if(0 <= _loc17_ && _loc17_ <= param5 * _loc15_)
         {
            _loc17_ /= _loc15_;
            param2[0] = _loc17_;
            param3.x = _loc9_ + _loc17_ * _loc12_;
            param3.y = _loc10_ + _loc17_ * _loc13_;
            param3.Normalize();
            return true;
         }
         return false;
      
}
ComputeMass(param1) {
         param1.mass = this.m_density * b2Settings.b2_pi * this.m_radius * this.m_radius;
         param1.center.SetV(this.m_localPosition);
         param1.I = param1.mass * (0.5 * this.m_radius * this.m_radius + (this.m_localPosition.x * this.m_localPosition.x + this.m_localPosition.y * this.m_localPosition.y));
      
}
ComputeSweptAABB(param1, param2, param3) {
         var _loc4_ = null;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         _loc4_ = param2.R;
         _loc5_ = param2.position.x + (_loc4_.col1.x * this.m_localPosition.x + _loc4_.col2.x * this.m_localPosition.y);
         _loc6_ = param2.position.y + (_loc4_.col1.y * this.m_localPosition.x + _loc4_.col2.y * this.m_localPosition.y);
         _loc4_ = param3.R;
         _loc7_ = param3.position.x + (_loc4_.col1.x * this.m_localPosition.x + _loc4_.col2.x * this.m_localPosition.y);
         _loc8_ = param3.position.y + (_loc4_.col1.y * this.m_localPosition.x + _loc4_.col2.y * this.m_localPosition.y);
         param1.lowerBound.Set((_loc5_ < _loc7_ ? _loc5_ : _loc7_) - this.m_radius,(_loc6_ < _loc8_ ? _loc6_ : _loc8_) - this.m_radius);
         param1.upperBound.Set((_loc5_ > _loc7_ ? _loc5_ : _loc7_) + this.m_radius,(_loc6_ > _loc8_ ? _loc6_ : _loc8_) + this.m_radius);
      
}
GetRadius() {
         return this.m_radius;
      
}
UpdateSweepRadius(param1) {
         var _loc2_ = NaN;
         var _loc3_ = NaN;
         _loc2_ = this.m_localPosition.x - param1.x;
         _loc3_ = this.m_localPosition.y - param1.y;
         _loc2_ = Math.sqrt(_loc2_ * _loc2_ + _loc3_ * _loc3_);
         this.m_sweepRadius = _loc2_ + this.m_radius - b2Settings.b2_toiSlop;
      
}
ComputeAABB(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         _loc3_ = param2.R;
         _loc4_ = param2.position.x + (_loc3_.col1.x * this.m_localPosition.x + _loc3_.col2.x * this.m_localPosition.y);
         _loc5_ = param2.position.y + (_loc3_.col1.y * this.m_localPosition.x + _loc3_.col2.y * this.m_localPosition.y);
         param1.lowerBound.Set(_loc4_ - this.m_radius,_loc5_ - this.m_radius);
         param1.upperBound.Set(_loc4_ + this.m_radius,_loc5_ + this.m_radius);
      
}
}
class b2PolygonDef extends b2ShapeDef {
static s_mat;
vertexCount = 0;
vertices = new Array(b2Settings.b2_maxPolygonVertices);
constructor() {
         var _loc1_ = 0;
         super();
         this.type = b2Shape.e_polygonShape;
         this.vertexCount = int(0);
         _loc1_ = int(0);
         while(_loc1_ < b2Settings.b2_maxPolygonVertices)
         {
            this.vertices[_loc1_] = new b2Vec2();
            _loc1_++;
         }
      
}
SetAsOrientedBox(param1, param2, param3 = null, param4 = 0) {
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = 0;
         this.vertexCount = int(4);
         this.vertices[0].Set(-param1,-param2);
         this.vertices[1].Set(param1,-param2);
         this.vertices[2].Set(param1,param2);
         this.vertices[3].Set(-param1,param2);
         if(param3)
         {
            _loc5_ = param3;
            _loc6_ = b2PolygonDef.s_mat;
            _loc6_.Set(param4);
            _loc7_ = int(0);
            while(_loc7_ < this.vertexCount)
            {
               param3 = this.vertices[_loc7_];
               param1 = _loc5_.x + (_loc6_.col1.x * param3.x + _loc6_.col2.x * param3.y);
               param3.y = _loc5_.y + (_loc6_.col1.y * param3.x + _loc6_.col2.y * param3.y);
               param3.x = param1;
               _loc7_++;
            }
         }
      
}
SetAsBox(param1, param2) {
         this.vertexCount = int(4);
         this.vertices[0].Set(-param1,-param2);
         this.vertices[1].Set(param1,-param2);
         this.vertices[2].Set(param1,param2);
         this.vertices[3].Set(-param1,param2);
      
}
}
class b2PolygonShape extends b2Shape {
static s_computeMat;
static s_sweptAABB1;
static s_sweptAABB2;
m_vertices = new Array(b2Settings.b2_maxPolygonVertices);
m_normals = new Array(b2Settings.b2_maxPolygonVertices);
s_supportVec = new b2Vec2();
m_obb = new b2OBB();
m_coreVertices = new Array(b2Settings.b2_maxPolygonVertices);
m_centroid = null;
m_vertexCount = 0;
constructor(param1) {
         var _loc2_ = null;
         var _loc3_ = 0;
         var _loc4_ = 0;
         var _loc5_ = 0;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         super(param1);
         this.m_type = b2Shape.e_polygonShape;
         _loc2_ = param1;
         this.m_vertexCount = int(_loc2_.vertexCount);
         _loc4_ = int(_loc3_);
         _loc5_ = int(_loc3_);
         _loc3_ = int(0);
         while(_loc3_ < this.m_vertexCount)
         {
            this.m_vertices[_loc3_] = _loc2_.vertices[_loc3_].Copy();
            _loc3_++;
         }
         _loc3_ = int(0);
         while(_loc3_ < this.m_vertexCount)
         {
            _loc4_ = int(_loc3_);
            _loc5_ = int(_loc3_ + 1 < this.m_vertexCount ? int(_loc3_ + 1) : 0);
            _loc6_ = this.m_vertices[_loc5_].x - this.m_vertices[_loc4_].x;
            _loc7_ = this.m_vertices[_loc5_].y - this.m_vertices[_loc4_].y;
            _loc8_ = Math.sqrt(_loc6_ * _loc6_ + _loc7_ * _loc7_);
            this.m_normals[_loc3_] = new b2Vec2(_loc7_ / _loc8_,-_loc6_ / _loc8_);
            _loc3_++;
         }
         this.m_centroid = b2PolygonShape.ComputeCentroid(_loc2_.vertices,_loc2_.vertexCount);
         b2PolygonShape.ComputeOBB(this.m_obb,this.m_vertices,this.m_vertexCount);
         _loc3_ = int(0);
         while(_loc3_ < this.m_vertexCount)
         {
            _loc4_ = int(_loc3_ - 1 >= 0 ? int(_loc3_ - 1) : int(this.m_vertexCount - 1));
            _loc5_ = int(_loc3_);
            _loc9_ = Number(this.m_normals[_loc4_].x);
            _loc10_ = Number(this.m_normals[_loc4_].y);
            _loc11_ = Number(this.m_normals[_loc5_].x);
            _loc12_ = Number(this.m_normals[_loc5_].y);
            _loc13_ = this.m_vertices[_loc3_].x - this.m_centroid.x;
            _loc14_ = this.m_vertices[_loc3_].y - this.m_centroid.y;
            _loc15_ = _loc9_ * _loc13_ + _loc10_ * _loc14_ - b2Settings.b2_toiSlop;
            _loc16_ = _loc11_ * _loc13_ + _loc12_ * _loc14_ - b2Settings.b2_toiSlop;
            _loc17_ = 1 / (_loc9_ * _loc12_ - _loc10_ * _loc11_);
            this.m_coreVertices[_loc3_] = new b2Vec2(_loc17_ * (_loc12_ * _loc15_ - _loc10_ * _loc16_) + this.m_centroid.x,_loc17_ * (_loc9_ * _loc16_ - _loc11_ * _loc15_) + this.m_centroid.y);
            _loc3_++;
         }
      
}
static ComputeCentroid(param1, param2) {param2=int(param2);
         var _loc3_ = null;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = 0;
         var _loc9_ = null;
         var _loc10_ = null;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         _loc3_ = new b2Vec2();
         _loc4_ = 0;
         _loc5_ = 0;
         _loc6_ = 0;
         _loc7_ = 1 / 3;
         _loc8_ = int(0);
         while(_loc8_ < param2)
         {
            _loc9_ = param1[_loc8_];
            _loc10_ = _loc8_ + 1 < param2 ? param1[int(_loc8_ + 1)] : param1[0];
            _loc11_ = _loc9_.x - _loc5_;
            _loc12_ = _loc9_.y - _loc6_;
            _loc13_ = _loc10_.x - _loc5_;
            _loc14_ = _loc10_.y - _loc6_;
            _loc15_ = _loc11_ * _loc14_ - _loc12_ * _loc13_;
            _loc16_ = 0.5 * _loc15_;
            _loc4_ += _loc16_;
            _loc3_.x += _loc16_ * _loc7_ * (_loc5_ + _loc9_.x + _loc10_.x);
            _loc3_.y += _loc16_ * _loc7_ * (_loc6_ + _loc9_.y + _loc10_.y);
            _loc8_++;
         }
         _loc3_.x *= 1 / _loc4_;
         _loc3_.y *= 1 / _loc4_;
         return _loc3_;
      
}
static ComputeOBB(param1, param2, param3) {param3=int(param3);
         var _loc4_ = 0;
         var _loc5_ = null;
         var _loc6_ = NaN;
         var _loc7_ = null;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = 0;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         var _loc22_ = NaN;
         var _loc23_ = NaN;
         var _loc24_ = NaN;
         var _loc25_ = null;
         _loc5_ = new Array(b2Settings.b2_maxPolygonVertices + 1);
         _loc4_ = int(0);
         while(_loc4_ < param3)
         {
            _loc5_[_loc4_] = param2[_loc4_];
            _loc4_++;
         }
         _loc5_[param3] = _loc5_[0];
         _loc6_ = Number.MAX_VALUE;
         _loc4_ = int(1);
         while(_loc4_ <= param3)
         {
            _loc7_ = _loc5_[int(_loc4_ - 1)];
            _loc8_ = _loc5_[_loc4_].x - _loc7_.x;
            _loc9_ = _loc5_[_loc4_].y - _loc7_.y;
            _loc10_ = Math.sqrt(_loc8_ * _loc8_ + _loc9_ * _loc9_);
            _loc8_ /= _loc10_;
            _loc9_ /= _loc10_;
            _loc11_ = -_loc9_;
            _loc12_ = _loc8_;
            _loc13_ = Number.MAX_VALUE;
            _loc14_ = Number.MAX_VALUE;
            _loc15_ = -Number.MAX_VALUE;
            _loc16_ = -Number.MAX_VALUE;
            _loc17_ = int(0);
            while(_loc17_ < param3)
            {
               _loc19_ = _loc5_[_loc17_].x - _loc7_.x;
               _loc20_ = _loc5_[_loc17_].y - _loc7_.y;
               _loc21_ = _loc8_ * _loc19_ + _loc9_ * _loc20_;
               _loc22_ = _loc11_ * _loc19_ + _loc12_ * _loc20_;
               if(_loc21_ < _loc13_)
               {
                  _loc13_ = _loc21_;
               }
               if(_loc22_ < _loc14_)
               {
                  _loc14_ = _loc22_;
               }
               if(_loc21_ > _loc15_)
               {
                  _loc15_ = _loc21_;
               }
               if(_loc22_ > _loc16_)
               {
                  _loc16_ = _loc22_;
               }
               _loc17_++;
            }
            _loc18_ = (_loc15_ - _loc13_) * (_loc16_ - _loc14_);
            if(_loc18_ < 0.95 * _loc6_)
            {
               _loc6_ = _loc18_;
               param1.R.col1.x = _loc8_;
               param1.R.col1.y = _loc9_;
               param1.R.col2.x = _loc11_;
               param1.R.col2.y = _loc12_;
               _loc23_ = 0.5 * (_loc13_ + _loc15_);
               _loc24_ = 0.5 * (_loc14_ + _loc16_);
               _loc25_ = param1.R;
               param1.center.x = _loc7_.x + (_loc25_.col1.x * _loc23_ + _loc25_.col2.x * _loc24_);
               param1.center.y = _loc7_.y + (_loc25_.col1.y * _loc23_ + _loc25_.col2.y * _loc24_);
               param1.extents.x = 0.5 * (_loc15_ - _loc13_);
               param1.extents.y = 0.5 * (_loc16_ - _loc14_);
            }
            _loc4_++;
         }
      
}
TestPoint(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = 0;
         var _loc10_ = NaN;
         _loc4_ = param1.R;
         _loc5_ = param2.x - param1.position.x;
         _loc6_ = param2.y - param1.position.y;
         _loc7_ = _loc5_ * _loc4_.col1.x + _loc6_ * _loc4_.col1.y;
         _loc8_ = _loc5_ * _loc4_.col2.x + _loc6_ * _loc4_.col2.y;
         _loc9_ = int(0);
         while(_loc9_ < this.m_vertexCount)
         {
            _loc3_ = this.m_vertices[_loc9_];
            _loc5_ = _loc7_ - _loc3_.x;
            _loc6_ = _loc8_ - _loc3_.y;
            _loc3_ = this.m_normals[_loc9_];
            _loc10_ = _loc3_.x * _loc5_ + _loc3_.y * _loc6_;
            if(_loc10_ > 0)
            {
               return false;
            }
            _loc9_++;
         }
         return true;
      
}
GetCoreVertices() {
         return this.m_coreVertices;
      
}
TestSegment(param1, param2, param3, param4, param5) {
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = null;
         var _loc11_ = null;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = 0;
         var _loc19_ = 0;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         _loc6_ = 0;
         _loc7_ = param5;
         _loc8_ = param4.p1.x - param1.position.x;
         _loc9_ = param4.p1.y - param1.position.y;
         _loc10_ = param1.R;
         _loc12_ = _loc8_ * _loc10_.col1.x + _loc9_ * _loc10_.col1.y;
         _loc13_ = _loc8_ * _loc10_.col2.x + _loc9_ * _loc10_.col2.y;
         _loc8_ = param4.p2.x - param1.position.x;
         _loc9_ = param4.p2.y - param1.position.y;
         _loc10_ = param1.R;
         _loc14_ = _loc8_ * _loc10_.col1.x + _loc9_ * _loc10_.col1.y;
         _loc15_ = _loc8_ * _loc10_.col2.x + _loc9_ * _loc10_.col2.y;
         _loc16_ = _loc14_ - _loc12_;
         _loc17_ = _loc15_ - _loc13_;
         _loc18_ = int(-1);
         _loc19_ = int(0);
         while(_loc19_ < this.m_vertexCount)
         {
            _loc11_ = this.m_vertices[_loc19_];
            _loc8_ = _loc11_.x - _loc12_;
            _loc9_ = _loc11_.y - _loc13_;
            _loc11_ = this.m_normals[_loc19_];
            _loc20_ = _loc11_.x * _loc8_ + _loc11_.y * _loc9_;
            _loc21_ = _loc11_.x * _loc16_ + _loc11_.y * _loc17_;
            if(_loc21_ < 0 && _loc20_ < _loc6_ * _loc21_)
            {
               _loc6_ = _loc20_ / _loc21_;
               _loc18_ = int(_loc19_);
            }
            else if(_loc21_ > 0 && _loc20_ < _loc7_ * _loc21_)
            {
               _loc7_ = _loc20_ / _loc21_;
            }
            if(_loc7_ < _loc6_)
            {
               return false;
            }
            _loc19_++;
         }
         if(_loc18_ >= 0)
         {
            param2[0] = _loc6_;
            _loc10_ = param1.R;
            _loc11_ = this.m_normals[_loc18_];
            param3.x = _loc10_.col1.x * _loc11_.x + _loc10_.col2.x * _loc11_.y;
            param3.y = _loc10_.col1.y * _loc11_.x + _loc10_.col2.y * _loc11_.y;
            return true;
         }
         return false;
      
}
GetCentroid() {
         return this.m_centroid;
      
}
ComputeMass(param1) {
         var _loc2_ = NaN;
         var _loc3_ = NaN;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = 0;
         var _loc10_ = null;
         var _loc11_ = null;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         var _loc22_ = NaN;
         var _loc23_ = NaN;
         var _loc24_ = NaN;
         var _loc25_ = NaN;
         _loc2_ = 0;
         _loc3_ = 0;
         _loc4_ = 0;
         _loc5_ = 0;
         _loc6_ = 0;
         _loc7_ = 0;
         _loc8_ = 1 / 3;
         _loc9_ = int(0);
         while(_loc9_ < this.m_vertexCount)
         {
            _loc10_ = this.m_vertices[_loc9_];
            _loc11_ = _loc9_ + 1 < this.m_vertexCount ? this.m_vertices[int(_loc9_ + 1)] : this.m_vertices[0];
            _loc12_ = _loc10_.x - _loc6_;
            _loc13_ = _loc10_.y - _loc7_;
            _loc14_ = _loc11_.x - _loc6_;
            _loc15_ = _loc11_.y - _loc7_;
            _loc16_ = _loc12_ * _loc15_ - _loc13_ * _loc14_;
            _loc17_ = 0.5 * _loc16_;
            _loc4_ += _loc17_;
            _loc2_ += _loc17_ * _loc8_ * (_loc6_ + _loc10_.x + _loc11_.x);
            _loc3_ += _loc17_ * _loc8_ * (_loc7_ + _loc10_.y + _loc11_.y);
            _loc18_ = _loc6_;
            _loc19_ = _loc7_;
            _loc20_ = _loc12_;
            _loc21_ = _loc13_;
            _loc22_ = _loc14_;
            _loc23_ = _loc15_;
            _loc24_ = _loc8_ * (0.25 * (_loc20_ * _loc20_ + _loc22_ * _loc20_ + _loc22_ * _loc22_) + (_loc18_ * _loc20_ + _loc18_ * _loc22_)) + 0.5 * _loc18_ * _loc18_;
            _loc25_ = _loc8_ * (0.25 * (_loc21_ * _loc21_ + _loc23_ * _loc21_ + _loc23_ * _loc23_) + (_loc19_ * _loc21_ + _loc19_ * _loc23_)) + 0.5 * _loc19_ * _loc19_;
            _loc5_ += _loc16_ * (_loc24_ + _loc25_);
            _loc9_++;
         }
         param1.mass = this.m_density * _loc4_;
         _loc2_ *= 1 / _loc4_;
         _loc3_ *= 1 / _loc4_;
         param1.center.Set(_loc2_,_loc3_);
         param1.I = this.m_density * _loc5_;
      
}
Support(param1, param2, param3) {
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = 0;
         var _loc9_ = NaN;
         var _loc10_ = 0;
         var _loc11_ = NaN;
         _loc5_ = param1.R;
         _loc6_ = param2 * _loc5_.col1.x + param3 * _loc5_.col1.y;
         _loc7_ = param2 * _loc5_.col2.x + param3 * _loc5_.col2.y;
         _loc8_ = int(0);
         _loc4_ = this.m_coreVertices[0];
         _loc9_ = _loc4_.x * _loc6_ + _loc4_.y * _loc7_;
         _loc10_ = int(1);
         while(_loc10_ < this.m_vertexCount)
         {
            _loc4_ = this.m_coreVertices[_loc10_];
            _loc11_ = _loc4_.x * _loc6_ + _loc4_.y * _loc7_;
            if(_loc11_ > _loc9_)
            {
               _loc8_ = int(_loc10_);
               _loc9_ = _loc11_;
            }
            _loc10_++;
         }
         _loc5_ = param1.R;
         _loc4_ = this.m_coreVertices[_loc8_];
         this.s_supportVec.x = param1.position.x + (_loc5_.col1.x * _loc4_.x + _loc5_.col2.x * _loc4_.y);
         this.s_supportVec.y = param1.position.y + (_loc5_.col1.y * _loc4_.x + _loc5_.col2.y * _loc4_.y);
         return this.s_supportVec;
      
}
GetVertexCount() {
         return this.m_vertexCount;
      
}
ComputeSweptAABB(param1, param2, param3) {
         var _loc4_ = null;
         var _loc5_ = null;
         _loc4_ = b2PolygonShape.s_sweptAABB1;
         _loc5_ = b2PolygonShape.s_sweptAABB2;
         this.ComputeAABB(_loc4_,param2);
         this.ComputeAABB(_loc5_,param3);
         param1.lowerBound.Set(_loc4_.lowerBound.x < _loc5_.lowerBound.x ? _loc4_.lowerBound.x : _loc5_.lowerBound.x,_loc4_.lowerBound.y < _loc5_.lowerBound.y ? _loc4_.lowerBound.y : _loc5_.lowerBound.y);
         param1.upperBound.Set(_loc4_.upperBound.x > _loc5_.upperBound.x ? _loc4_.upperBound.x : _loc5_.upperBound.x,_loc4_.upperBound.y > _loc5_.upperBound.y ? _loc4_.upperBound.y : _loc5_.upperBound.y);
      
}
GetVertices() {
         return this.m_vertices;
      
}
GetNormals() {
         return this.m_normals;
      
}
GetOBB() {
         return this.m_obb;
      
}
GetFirstVertex(param1) {
         return b2Math.b2MulX(param1,this.m_coreVertices[0]);
      
}
Centroid(param1) {
         return b2Math.b2MulX(param1,this.m_centroid);
      
}
UpdateSweepRadius(param1) {
         var _loc2_ = null;
         var _loc3_ = 0;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         this.m_sweepRadius = 0;
         _loc3_ = int(0);
         while(_loc3_ < this.m_vertexCount)
         {
            _loc2_ = this.m_coreVertices[_loc3_];
            _loc4_ = _loc2_.x - param1.x;
            _loc5_ = _loc2_.y - param1.y;
            _loc4_ = Math.sqrt(_loc4_ * _loc4_ + _loc5_ * _loc5_);
            if(_loc4_ > this.m_sweepRadius)
            {
               this.m_sweepRadius = _loc4_;
            }
            _loc3_++;
         }
      
}
ComputeAABB(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         _loc5_ = b2PolygonShape.s_computeMat;
         _loc3_ = param2.R;
         _loc4_ = this.m_obb.R.col1;
         _loc5_.col1.x = _loc3_.col1.x * _loc4_.x + _loc3_.col2.x * _loc4_.y;
         _loc5_.col1.y = _loc3_.col1.y * _loc4_.x + _loc3_.col2.y * _loc4_.y;
         _loc4_ = this.m_obb.R.col2;
         _loc5_.col2.x = _loc3_.col1.x * _loc4_.x + _loc3_.col2.x * _loc4_.y;
         _loc5_.col2.y = _loc3_.col1.y * _loc4_.x + _loc3_.col2.y * _loc4_.y;
         _loc5_.Abs();
         _loc6_ = _loc5_;
         _loc4_ = this.m_obb.extents;
         _loc7_ = _loc6_.col1.x * _loc4_.x + _loc6_.col2.x * _loc4_.y;
         _loc8_ = _loc6_.col1.y * _loc4_.x + _loc6_.col2.y * _loc4_.y;
         _loc3_ = param2.R;
         _loc4_ = this.m_obb.center;
         _loc9_ = param2.position.x + (_loc3_.col1.x * _loc4_.x + _loc3_.col2.x * _loc4_.y);
         _loc10_ = param2.position.y + (_loc3_.col1.y * _loc4_.x + _loc3_.col2.y * _loc4_.y);
         param1.lowerBound.Set(_loc9_ - _loc7_,_loc10_ - _loc8_);
         param1.upperBound.Set(_loc9_ + _loc7_,_loc10_ + _loc8_);
      
}
}
class b2CircleContact extends b2Contact {
static s_evalCP;
m_manifolds = [new b2Manifold()];
m0 = new b2Manifold();
m_manifold = null;
constructor(param1, param2) {
         var _loc3_ = null;
         super(param1,param2);
         this.m_manifold = this.m_manifolds[0];
         this.m_manifold.pointCount = 0;
         _loc3_ = this.m_manifold.points[0];
         _loc3_.normalImpulse = 0;
         _loc3_.tangentImpulse = 0;
      
}
static Destroy(param1, param2) {
      
}
static Create(param1, param2, param3) {
         return new b2CircleContact(param1,param2);
      
}
GetManifolds() {
         return this.m_manifolds;
      
}
Evaluate(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = null;
         _loc5_ = this.m_shape1.m_body;
         _loc6_ = this.m_shape2.m_body;
         this.m0.Set(this.m_manifold);
         b2Collision.b2CollideCircles(this.m_manifold,this.m_shape1,_loc5_.m_xf,this.m_shape2,_loc6_.m_xf);
         _loc7_ = b2CircleContact.s_evalCP;
         _loc7_.shape1 = this.m_shape1;
         _loc7_.shape2 = this.m_shape2;
         _loc7_.friction = this.m_friction;
         _loc7_.restitution = this.m_restitution;
         if(this.m_manifold.pointCount > 0)
         {
            this.m_manifoldCount = 1;
            _loc8_ = this.m_manifold.points[0];
            if(this.m0.pointCount == 0)
            {
               _loc8_.normalImpulse = 0;
               _loc8_.tangentImpulse = 0;
               if(param1)
               {
                  _loc7_.position = _loc5_.GetWorldPoint(_loc8_.localPoint1);
                  _loc2_ = _loc5_.GetLinearVelocityFromLocalPoint(_loc8_.localPoint1);
                  _loc3_ = _loc6_.GetLinearVelocityFromLocalPoint(_loc8_.localPoint2);
                  _loc7_.velocity.Set(_loc3_.x - _loc2_.x,_loc3_.y - _loc2_.y);
                  _loc7_.normal.SetV(this.m_manifold.normal);
                  _loc7_.separation = _loc8_.separation;
                  _loc7_.id.key = _loc8_.id._key;
                  param1.Add(_loc7_);
               }
            }
            else
            {
               _loc4_ = this.m0.points[0];
               _loc8_.normalImpulse = _loc4_.normalImpulse;
               _loc8_.tangentImpulse = _loc4_.tangentImpulse;
               if(param1)
               {
                  _loc7_.position = _loc5_.GetWorldPoint(_loc8_.localPoint1);
                  _loc2_ = _loc5_.GetLinearVelocityFromLocalPoint(_loc8_.localPoint1);
                  _loc3_ = _loc6_.GetLinearVelocityFromLocalPoint(_loc8_.localPoint2);
                  _loc7_.velocity.Set(_loc3_.x - _loc2_.x,_loc3_.y - _loc2_.y);
                  _loc7_.normal.SetV(this.m_manifold.normal);
                  _loc7_.separation = _loc8_.separation;
                  _loc7_.id.key = _loc8_.id._key;
                  param1.Persist(_loc7_);
               }
            }
         }
         else
         {
            this.m_manifoldCount = 0;
            if(this.m0.pointCount > 0 && Boolean(param1))
            {
               _loc4_ = this.m0.points[0];
               _loc7_.position = _loc5_.GetWorldPoint(_loc4_.localPoint1);
               _loc2_ = _loc5_.GetLinearVelocityFromLocalPoint(_loc4_.localPoint1);
               _loc3_ = _loc6_.GetLinearVelocityFromLocalPoint(_loc4_.localPoint2);
               _loc7_.velocity.Set(_loc3_.x - _loc2_.x,_loc3_.y - _loc2_.y);
               _loc7_.normal.SetV(this.m0.normal);
               _loc7_.separation = _loc4_.separation;
               _loc7_.id.key = _loc4_.id._key;
               param1.Remove(_loc7_);
            }
         }
      
}
}
class b2NullContact extends b2Contact {
constructor() {
         super();
      
}
GetManifolds() {
         return null;
      
}
Evaluate(param1) {
      
}
}
class b2PolyAndCircleContact extends b2Contact {
static s_evalCP;
m_manifolds = [new b2Manifold()];
m0 = new b2Manifold();
m_manifold = null;
constructor(param1, param2) {
         var _loc3_ = null;
         super(param1,param2);
         this.m_manifold = this.m_manifolds[0];
         b2Settings.b2Assert(this.m_shape1.m_type == b2Shape.e_polygonShape);
         b2Settings.b2Assert(this.m_shape2.m_type == b2Shape.e_circleShape);
         this.m_manifold.pointCount = 0;
         _loc3_ = this.m_manifold.points[0];
         _loc3_.normalImpulse = 0;
         _loc3_.tangentImpulse = 0;
      
}
static Destroy(param1, param2) {
      
}
static Create(param1, param2, param3) {
         return new b2PolyAndCircleContact(param1,param2);
      
}
GetManifolds() {
         return this.m_manifolds;
      
}
Evaluate(param1) {
         var _loc2_ = 0;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = null;
         var _loc10_ = null;
         var _loc11_ = false;
         var _loc12_ = 0;
         var _loc13_ = 0;
         _loc6_ = this.m_shape1.m_body;
         _loc7_ = this.m_shape2.m_body;
         this.m0.Set(this.m_manifold);
         b2Collision.b2CollidePolygonAndCircle(this.m_manifold,this.m_shape1,_loc6_.m_xf,this.m_shape2,_loc7_.m_xf);
         _loc8_ = [false,false];
         _loc9_ = b2PolyAndCircleContact.s_evalCP;
         _loc9_.shape1 = this.m_shape1;
         _loc9_.shape2 = this.m_shape2;
         _loc9_.friction = this.m_friction;
         _loc9_.restitution = this.m_restitution;
         if(this.m_manifold.pointCount > 0)
         {
            _loc2_ = int(0);
            while(_loc2_ < this.m_manifold.pointCount)
            {
               _loc10_ = this.m_manifold.points[_loc2_];
               _loc10_.normalImpulse = 0;
               _loc10_.tangentImpulse = 0;
               _loc11_ = false;
               _loc12_ = uint(_loc10_.id._key);
               _loc13_ = int(0);
               while(_loc13_ < this.m0.pointCount)
               {
                  if(_loc8_[_loc13_] != true)
                  {
                     _loc5_ = this.m0.points[_loc13_];
                     if(_loc5_.id._key == _loc12_)
                     {
                        _loc8_[_loc13_] = true;
                        _loc10_.normalImpulse = _loc5_.normalImpulse;
                        _loc10_.tangentImpulse = _loc5_.tangentImpulse;
                        _loc11_ = true;
                        if(param1 != null)
                        {
                           _loc9_.position = _loc6_.GetWorldPoint(_loc10_.localPoint1);
                           _loc3_ = _loc6_.GetLinearVelocityFromLocalPoint(_loc10_.localPoint1);
                           _loc4_ = _loc7_.GetLinearVelocityFromLocalPoint(_loc10_.localPoint2);
                           _loc9_.velocity.Set(_loc4_.x - _loc3_.x,_loc4_.y - _loc3_.y);
                           _loc9_.normal.SetV(this.m_manifold.normal);
                           _loc9_.separation = _loc10_.separation;
                           _loc9_.id.key = _loc12_;
                           param1.Persist(_loc9_);
                        }
                        break;
                     }
                  }
                  _loc13_++;
               }
               if(_loc11_ == false && param1 != null)
               {
                  _loc9_.position = _loc6_.GetWorldPoint(_loc10_.localPoint1);
                  _loc3_ = _loc6_.GetLinearVelocityFromLocalPoint(_loc10_.localPoint1);
                  _loc4_ = _loc7_.GetLinearVelocityFromLocalPoint(_loc10_.localPoint2);
                  _loc9_.velocity.Set(_loc4_.x - _loc3_.x,_loc4_.y - _loc3_.y);
                  _loc9_.normal.SetV(this.m_manifold.normal);
                  _loc9_.separation = _loc10_.separation;
                  _loc9_.id.key = _loc12_;
                  param1.Add(_loc9_);
               }
               _loc2_++;
            }
            this.m_manifoldCount = 1;
         }
         else
         {
            this.m_manifoldCount = 0;
         }
         if(param1 == null)
         {
            return;
         }
         _loc2_ = int(0);
         while(_loc2_ < this.m0.pointCount)
         {
            if(!_loc8_[_loc2_])
            {
               _loc5_ = this.m0.points[_loc2_];
               _loc9_.position = _loc6_.GetWorldPoint(_loc5_.localPoint1);
               _loc3_ = _loc6_.GetLinearVelocityFromLocalPoint(_loc5_.localPoint1);
               _loc4_ = _loc7_.GetLinearVelocityFromLocalPoint(_loc5_.localPoint2);
               _loc9_.velocity.Set(_loc4_.x - _loc3_.x,_loc4_.y - _loc3_.y);
               _loc9_.normal.SetV(this.m0.normal);
               _loc9_.separation = _loc5_.separation;
               _loc9_.id.key = _loc5_.id._key;
               param1.Remove(_loc9_);
            }
            _loc2_++;
         }
      
}
}
class b2PolygonContact extends b2Contact {
static s_evalCP;
m_manifolds = [new b2Manifold()];
m0 = new b2Manifold();
m_manifold = null;
constructor(param1, param2) {
         super(param1,param2);
         this.m_manifold = this.m_manifolds[0];
         this.m_manifold.pointCount = 0;
      
}
static Destroy(param1, param2) {
      
}
static Create(param1, param2, param3) {
         return new b2PolygonContact(param1,param2);
      
}
GetManifolds() {
         return this.m_manifolds;
      
}
Evaluate(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = 0;
         var _loc9_ = null;
         var _loc10_ = null;
         var _loc11_ = false;
         var _loc12_ = 0;
         var _loc13_ = 0;
         _loc5_ = this.m_shape1.m_body;
         _loc6_ = this.m_shape2.m_body;
         this.m0.Set(this.m_manifold);
         b2Collision.b2CollidePolygons(this.m_manifold,this.m_shape1,_loc5_.m_xf,this.m_shape2,_loc6_.m_xf);
         _loc9_ = [false,false];
         _loc7_ = b2PolygonContact.s_evalCP;
         _loc7_.shape1 = this.m_shape1;
         _loc7_.shape2 = this.m_shape2;
         _loc7_.friction = this.m_friction;
         _loc7_.restitution = this.m_restitution;
         if(this.m_manifold.pointCount > 0)
         {
            _loc8_ = int(0);
            while(_loc8_ < this.m_manifold.pointCount)
            {
               _loc10_ = this.m_manifold.points[_loc8_];
               _loc10_.normalImpulse = 0;
               _loc10_.tangentImpulse = 0;
               _loc11_ = false;
               _loc12_ = uint(_loc10_.id._key);
               _loc13_ = int(0);
               while(_loc13_ < this.m0.pointCount)
               {
                  if(_loc9_[_loc13_] != true)
                  {
                     _loc4_ = this.m0.points[_loc13_];
                     if(_loc4_.id._key == _loc12_)
                     {
                        _loc9_[_loc13_] = true;
                        _loc10_.normalImpulse = _loc4_.normalImpulse;
                        _loc10_.tangentImpulse = _loc4_.tangentImpulse;
                        _loc11_ = true;
                        if(param1 != null)
                        {
                           _loc7_.position = _loc5_.GetWorldPoint(_loc10_.localPoint1);
                           _loc2_ = _loc5_.GetLinearVelocityFromLocalPoint(_loc10_.localPoint1);
                           _loc3_ = _loc6_.GetLinearVelocityFromLocalPoint(_loc10_.localPoint2);
                           _loc7_.velocity.Set(_loc3_.x - _loc2_.x,_loc3_.y - _loc2_.y);
                           _loc7_.normal.SetV(this.m_manifold.normal);
                           _loc7_.separation = _loc10_.separation;
                           _loc7_.id.key = _loc12_;
                           param1.Persist(_loc7_);
                        }
                        break;
                     }
                  }
                  _loc13_++;
               }
               if(_loc11_ == false && param1 != null)
               {
                  _loc7_.position = _loc5_.GetWorldPoint(_loc10_.localPoint1);
                  _loc2_ = _loc5_.GetLinearVelocityFromLocalPoint(_loc10_.localPoint1);
                  _loc3_ = _loc6_.GetLinearVelocityFromLocalPoint(_loc10_.localPoint2);
                  _loc7_.velocity.Set(_loc3_.x - _loc2_.x,_loc3_.y - _loc2_.y);
                  _loc7_.normal.SetV(this.m_manifold.normal);
                  _loc7_.separation = _loc10_.separation;
                  _loc7_.id.key = _loc12_;
                  param1.Add(_loc7_);
               }
               _loc8_++;
            }
            this.m_manifoldCount = 1;
         }
         else
         {
            this.m_manifoldCount = 0;
         }
         if(param1 == null)
         {
            return;
         }
         _loc8_ = int(0);
         while(_loc8_ < this.m0.pointCount)
         {
            if(!_loc9_[_loc8_])
            {
               _loc4_ = this.m0.points[_loc8_];
               _loc7_.position = _loc5_.GetWorldPoint(_loc4_.localPoint1);
               _loc2_ = _loc5_.GetLinearVelocityFromLocalPoint(_loc4_.localPoint1);
               _loc3_ = _loc6_.GetLinearVelocityFromLocalPoint(_loc4_.localPoint2);
               _loc7_.velocity.Set(_loc3_.x - _loc2_.x,_loc3_.y - _loc2_.y);
               _loc7_.normal.SetV(this.m0.normal);
               _loc7_.separation = _loc4_.separation;
               _loc7_.id.key = _loc4_.id._key;
               param1.Remove(_loc7_);
            }
            _loc8_++;
         }
      
}
}
class b2DistanceJoint extends b2Joint {
m_mass = NaN;
m_u = new b2Vec2();
m_impulse = NaN;
m_dampingRatio = NaN;
m_frequencyHz = NaN;
m_localAnchor2 = new b2Vec2();
m_localAnchor1 = new b2Vec2();
m_bias = NaN;
m_gamma = NaN;
m_length = NaN;
constructor(param1) {
         var _loc3_ = NaN;
         var _loc4_ = NaN;
         super(param1);
         this.m_localAnchor1.SetV(param1.localAnchor1);
         this.m_localAnchor2.SetV(param1.localAnchor2);
         this.m_length = param1.length;
         this.m_frequencyHz = param1.frequencyHz;
         this.m_dampingRatio = param1.dampingRatio;
         this.m_impulse = 0;
         this.m_gamma = 0;
         this.m_bias = 0;
         this.m_inv_dt = 0;
      
}
GetAnchor1() {
         return this.m_body1.GetWorldPoint(this.m_localAnchor1);
      
}
GetAnchor2() {
         return this.m_body2.GetWorldPoint(this.m_localAnchor2);
      
}
GetReactionForce() {
         var _loc1_ = null;
         _loc1_ = new b2Vec2();
         _loc1_.SetV(this.m_u);
         _loc1_.Multiply(this.m_inv_dt * this.m_impulse);
         return _loc1_;
      
}
SolvePositionConstraints() {
         var _loc1_ = null;
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         if(this.m_frequencyHz > 0)
         {
            return true;
         }
         _loc2_ = this.m_body1;
         _loc3_ = this.m_body2;
         _loc1_ = _loc2_.m_xf.R;
         _loc4_ = this.m_localAnchor1.x - _loc2_.m_sweep.localCenter.x;
         _loc5_ = this.m_localAnchor1.y - _loc2_.m_sweep.localCenter.y;
         _loc6_ = _loc1_.col1.x * _loc4_ + _loc1_.col2.x * _loc5_;
         _loc5_ = _loc1_.col1.y * _loc4_ + _loc1_.col2.y * _loc5_;
         _loc4_ = _loc6_;
         _loc1_ = _loc3_.m_xf.R;
         _loc7_ = this.m_localAnchor2.x - _loc3_.m_sweep.localCenter.x;
         _loc8_ = this.m_localAnchor2.y - _loc3_.m_sweep.localCenter.y;
         _loc6_ = _loc1_.col1.x * _loc7_ + _loc1_.col2.x * _loc8_;
         _loc8_ = _loc1_.col1.y * _loc7_ + _loc1_.col2.y * _loc8_;
         _loc7_ = _loc6_;
         _loc9_ = _loc3_.m_sweep.c.x + _loc7_ - _loc2_.m_sweep.c.x - _loc4_;
         _loc10_ = _loc3_.m_sweep.c.y + _loc8_ - _loc2_.m_sweep.c.y - _loc5_;
         _loc11_ = Math.sqrt(_loc9_ * _loc9_ + _loc10_ * _loc10_);
         _loc9_ /= _loc11_;
         _loc10_ /= _loc11_;
         _loc12_ = _loc11_ - this.m_length;
         _loc12_ = b2Math.b2Clamp(_loc12_,-b2Settings.b2_maxLinearCorrection,b2Settings.b2_maxLinearCorrection);
         _loc13_ = -this.m_mass * _loc12_;
         this.m_u.Set(_loc9_,_loc10_);
         _loc14_ = _loc13_ * this.m_u.x;
         _loc15_ = _loc13_ * this.m_u.y;
         _loc2_.m_sweep.c.x -= _loc2_.m_invMass * _loc14_;
         _loc2_.m_sweep.c.y -= _loc2_.m_invMass * _loc15_;
         _loc2_.m_sweep.a -= _loc2_.m_invI * (_loc4_ * _loc15_ - _loc5_ * _loc14_);
         _loc3_.m_sweep.c.x += _loc3_.m_invMass * _loc14_;
         _loc3_.m_sweep.c.y += _loc3_.m_invMass * _loc15_;
         _loc3_.m_sweep.a += _loc3_.m_invI * (_loc7_ * _loc15_ - _loc8_ * _loc14_);
         _loc2_.SynchronizeTransform();
         _loc3_.SynchronizeTransform();
         return b2Math.b2Abs(_loc12_) < b2Settings.b2_linearSlop;
      
}
InitVelocityConstraints(param1) {
         var _loc2_ = null;
         var _loc3_ = NaN;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         this.m_inv_dt = param1.inv_dt;
         _loc4_ = this.m_body1;
         _loc5_ = this.m_body2;
         _loc2_ = _loc4_.m_xf.R;
         _loc6_ = this.m_localAnchor1.x - _loc4_.m_sweep.localCenter.x;
         _loc7_ = this.m_localAnchor1.y - _loc4_.m_sweep.localCenter.y;
         _loc3_ = _loc2_.col1.x * _loc6_ + _loc2_.col2.x * _loc7_;
         _loc7_ = _loc2_.col1.y * _loc6_ + _loc2_.col2.y * _loc7_;
         _loc6_ = _loc3_;
         _loc2_ = _loc5_.m_xf.R;
         _loc8_ = this.m_localAnchor2.x - _loc5_.m_sweep.localCenter.x;
         _loc9_ = this.m_localAnchor2.y - _loc5_.m_sweep.localCenter.y;
         _loc3_ = _loc2_.col1.x * _loc8_ + _loc2_.col2.x * _loc9_;
         _loc9_ = _loc2_.col1.y * _loc8_ + _loc2_.col2.y * _loc9_;
         _loc8_ = _loc3_;
         this.m_u.x = _loc5_.m_sweep.c.x + _loc8_ - _loc4_.m_sweep.c.x - _loc6_;
         this.m_u.y = _loc5_.m_sweep.c.y + _loc9_ - _loc4_.m_sweep.c.y - _loc7_;
         _loc10_ = Math.sqrt(this.m_u.x * this.m_u.x + this.m_u.y * this.m_u.y);
         if(_loc10_ > b2Settings.b2_linearSlop)
         {
            this.m_u.Multiply(1 / _loc10_);
         }
         else
         {
            this.m_u.SetZero();
         }
         _loc11_ = _loc6_ * this.m_u.y - _loc7_ * this.m_u.x;
         _loc12_ = _loc8_ * this.m_u.y - _loc9_ * this.m_u.x;
         _loc13_ = _loc4_.m_invMass + _loc4_.m_invI * _loc11_ * _loc11_ + _loc5_.m_invMass + _loc5_.m_invI * _loc12_ * _loc12_;
         this.m_mass = 1 / _loc13_;
         if(this.m_frequencyHz > 0)
         {
            _loc14_ = _loc10_ - this.m_length;
            _loc15_ = 2 * Math.PI * this.m_frequencyHz;
            _loc16_ = 2 * this.m_mass * this.m_dampingRatio * _loc15_;
            _loc17_ = this.m_mass * _loc15_ * _loc15_;
            this.m_gamma = 1 / (param1.dt * (_loc16_ + param1.dt * _loc17_));
            this.m_bias = _loc14_ * param1.dt * _loc17_ * this.m_gamma;
            this.m_mass = 1 / (_loc13_ + this.m_gamma);
         }
         if(param1.warmStarting)
         {
            this.m_impulse *= param1.dtRatio;
            _loc18_ = this.m_impulse * this.m_u.x;
            _loc19_ = this.m_impulse * this.m_u.y;
            _loc4_.m_linearVelocity.x -= _loc4_.m_invMass * _loc18_;
            _loc4_.m_linearVelocity.y -= _loc4_.m_invMass * _loc19_;
            _loc4_.m_angularVelocity -= _loc4_.m_invI * (_loc6_ * _loc19_ - _loc7_ * _loc18_);
            _loc5_.m_linearVelocity.x += _loc5_.m_invMass * _loc18_;
            _loc5_.m_linearVelocity.y += _loc5_.m_invMass * _loc19_;
            _loc5_.m_angularVelocity += _loc5_.m_invI * (_loc8_ * _loc19_ - _loc9_ * _loc18_);
         }
         else
         {
            this.m_impulse = 0;
         }
      
}
GetReactionTorque() {
         return 0;
      
}
SolveVelocityConstraints(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         _loc3_ = this.m_body1;
         _loc4_ = this.m_body2;
         _loc2_ = _loc3_.m_xf.R;
         _loc5_ = this.m_localAnchor1.x - _loc3_.m_sweep.localCenter.x;
         _loc6_ = this.m_localAnchor1.y - _loc3_.m_sweep.localCenter.y;
         _loc7_ = _loc2_.col1.x * _loc5_ + _loc2_.col2.x * _loc6_;
         _loc6_ = _loc2_.col1.y * _loc5_ + _loc2_.col2.y * _loc6_;
         _loc5_ = _loc7_;
         _loc2_ = _loc4_.m_xf.R;
         _loc8_ = this.m_localAnchor2.x - _loc4_.m_sweep.localCenter.x;
         _loc9_ = this.m_localAnchor2.y - _loc4_.m_sweep.localCenter.y;
         _loc7_ = _loc2_.col1.x * _loc8_ + _loc2_.col2.x * _loc9_;
         _loc9_ = _loc2_.col1.y * _loc8_ + _loc2_.col2.y * _loc9_;
         _loc8_ = _loc7_;
         _loc10_ = _loc3_.m_linearVelocity.x + -_loc3_.m_angularVelocity * _loc6_;
         _loc11_ = _loc3_.m_linearVelocity.y + _loc3_.m_angularVelocity * _loc5_;
         _loc12_ = _loc4_.m_linearVelocity.x + -_loc4_.m_angularVelocity * _loc9_;
         _loc13_ = _loc4_.m_linearVelocity.y + _loc4_.m_angularVelocity * _loc8_;
         _loc14_ = this.m_u.x * (_loc12_ - _loc10_) + this.m_u.y * (_loc13_ - _loc11_);
         _loc15_ = -this.m_mass * (_loc14_ + this.m_bias + this.m_gamma * this.m_impulse);
         this.m_impulse += _loc15_;
         _loc16_ = _loc15_ * this.m_u.x;
         _loc17_ = _loc15_ * this.m_u.y;
         _loc3_.m_linearVelocity.x -= _loc3_.m_invMass * _loc16_;
         _loc3_.m_linearVelocity.y -= _loc3_.m_invMass * _loc17_;
         _loc3_.m_angularVelocity -= _loc3_.m_invI * (_loc5_ * _loc17_ - _loc6_ * _loc16_);
         _loc4_.m_linearVelocity.x += _loc4_.m_invMass * _loc16_;
         _loc4_.m_linearVelocity.y += _loc4_.m_invMass * _loc17_;
         _loc4_.m_angularVelocity += _loc4_.m_invI * (_loc8_ * _loc17_ - _loc9_ * _loc16_);
      
}
}
class b2DistanceJointDef extends b2JointDef {
length = NaN;
dampingRatio = NaN;
frequencyHz = NaN;
localAnchor2 = new b2Vec2();
localAnchor1 = new b2Vec2();
constructor() {
         super();
         this.type = b2Joint.e_distanceJoint;
         this.length = 1;
         this.frequencyHz = 0;
         this.dampingRatio = 0;
      
}
Initialize(param1, param2, param3, param4) {
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         this.body1 = param1;
         this.body2 = param2;
         this.localAnchor1.SetV(this.body1.GetLocalPoint(param3));
         this.localAnchor2.SetV(this.body2.GetLocalPoint(param4));
         _loc5_ = param4.x - param3.x;
         _loc6_ = param4.y - param3.y;
         this.length = Math.sqrt(_loc5_ * _loc5_ + _loc6_ * _loc6_);
         this.frequencyHz = 0;
         this.dampingRatio = 0;
      
}
}
class b2GearJoint extends b2Joint {
m_force = NaN;
m_mass = NaN;
m_prismatic1 = null;
m_prismatic2 = null;
m_ground1 = null;
m_ground2 = null;
m_constant = NaN;
m_revolute1 = null;
m_revolute2 = null;
m_groundAnchor1 = new b2Vec2();
m_groundAnchor2 = new b2Vec2();
m_localAnchor1 = new b2Vec2();
m_localAnchor2 = new b2Vec2();
m_ratio = NaN;
m_J = new b2Jacobian();
constructor(param1) {
         var _loc2_ = 0;
         var _loc3_ = 0;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         super(param1);
         _loc2_ = int(param1.joint1.m_type);
         _loc3_ = int(param1.joint2.m_type);
         this.m_revolute1 = null;
         this.m_prismatic1 = null;
         this.m_revolute2 = null;
         this.m_prismatic2 = null;
         this.m_ground1 = param1.joint1.m_body1;
         this.m_body1 = param1.joint1.m_body2;
         if(_loc2_ == b2Joint.e_revoluteJoint)
         {
            this.m_revolute1 = param1.joint1;
            this.m_groundAnchor1.SetV(this.m_revolute1.m_localAnchor1);
            this.m_localAnchor1.SetV(this.m_revolute1.m_localAnchor2);
            _loc4_ = this.m_revolute1.GetJointAngle();
         }
         else
         {
            this.m_prismatic1 = param1.joint1;
            this.m_groundAnchor1.SetV(this.m_prismatic1.m_localAnchor1);
            this.m_localAnchor1.SetV(this.m_prismatic1.m_localAnchor2);
            _loc4_ = this.m_prismatic1.GetJointTranslation();
         }
         this.m_ground2 = param1.joint2.m_body1;
         this.m_body2 = param1.joint2.m_body2;
         if(_loc3_ == b2Joint.e_revoluteJoint)
         {
            this.m_revolute2 = param1.joint2;
            this.m_groundAnchor2.SetV(this.m_revolute2.m_localAnchor1);
            this.m_localAnchor2.SetV(this.m_revolute2.m_localAnchor2);
            _loc5_ = this.m_revolute2.GetJointAngle();
         }
         else
         {
            this.m_prismatic2 = param1.joint2;
            this.m_groundAnchor2.SetV(this.m_prismatic2.m_localAnchor1);
            this.m_localAnchor2.SetV(this.m_prismatic2.m_localAnchor2);
            _loc5_ = this.m_prismatic2.GetJointTranslation();
         }
         this.m_ratio = param1.ratio;
         this.m_constant = _loc4_ + this.m_ratio * _loc5_;
         this.m_force = 0;
      
}
GetAnchor1() {
         return this.m_body1.GetWorldPoint(this.m_localAnchor1);
      
}
GetAnchor2() {
         return this.m_body2.GetWorldPoint(this.m_localAnchor2);
      
}
GetReactionForce() {
         var _loc1_ = null;
         return new b2Vec2(this.m_force * this.m_J.linear2.x,this.m_force * this.m_J.linear2.y);
      
}
SolvePositionConstraints() {
         var _loc1_ = NaN;
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         _loc1_ = 0;
         _loc2_ = this.m_body1;
         _loc3_ = this.m_body2;
         if(this.m_revolute1)
         {
            _loc4_ = this.m_revolute1.GetJointAngle();
         }
         else
         {
            _loc4_ = this.m_prismatic1.GetJointTranslation();
         }
         if(this.m_revolute2)
         {
            _loc5_ = this.m_revolute2.GetJointAngle();
         }
         else
         {
            _loc5_ = this.m_prismatic2.GetJointTranslation();
         }
         _loc6_ = this.m_constant - (_loc4_ + this.m_ratio * _loc5_);
         _loc7_ = -this.m_mass * _loc6_;
         _loc2_.m_sweep.c.x += _loc2_.m_invMass * _loc7_ * this.m_J.linear1.x;
         _loc2_.m_sweep.c.y += _loc2_.m_invMass * _loc7_ * this.m_J.linear1.y;
         _loc2_.m_sweep.a += _loc2_.m_invI * _loc7_ * this.m_J.angular1;
         _loc3_.m_sweep.c.x += _loc3_.m_invMass * _loc7_ * this.m_J.linear2.x;
         _loc3_.m_sweep.c.y += _loc3_.m_invMass * _loc7_ * this.m_J.linear2.y;
         _loc3_.m_sweep.a += _loc3_.m_invI * _loc7_ * this.m_J.angular2;
         _loc2_.SynchronizeTransform();
         _loc3_.SynchronizeTransform();
         return _loc1_ < b2Settings.b2_linearSlop;
      
}
InitVelocityConstraints(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = null;
         var _loc11_ = null;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         _loc2_ = this.m_ground1;
         _loc3_ = this.m_ground2;
         _loc4_ = this.m_body1;
         _loc5_ = this.m_body2;
         _loc14_ = 0;
         this.m_J.SetZero();
         if(this.m_revolute1)
         {
            this.m_J.angular1 = -1;
            _loc14_ += _loc4_.m_invI;
         }
         else
         {
            _loc10_ = _loc2_.m_xf.R;
            _loc11_ = this.m_prismatic1.m_localXAxis1;
            _loc6_ = _loc10_.col1.x * _loc11_.x + _loc10_.col2.x * _loc11_.y;
            _loc7_ = _loc10_.col1.y * _loc11_.x + _loc10_.col2.y * _loc11_.y;
            _loc10_ = _loc4_.m_xf.R;
            _loc8_ = this.m_localAnchor1.x - _loc4_.m_sweep.localCenter.x;
            _loc9_ = this.m_localAnchor1.y - _loc4_.m_sweep.localCenter.y;
            _loc13_ = _loc10_.col1.x * _loc8_ + _loc10_.col2.x * _loc9_;
            _loc9_ = _loc10_.col1.y * _loc8_ + _loc10_.col2.y * _loc9_;
            _loc8_ = _loc13_;
            _loc12_ = _loc8_ * _loc7_ - _loc9_ * _loc6_;
            this.m_J.linear1.Set(-_loc6_,-_loc7_);
            this.m_J.angular1 = -_loc12_;
            _loc14_ += _loc4_.m_invMass + _loc4_.m_invI * _loc12_ * _loc12_;
         }
         if(this.m_revolute2)
         {
            this.m_J.angular2 = -this.m_ratio;
            _loc14_ += this.m_ratio * this.m_ratio * _loc5_.m_invI;
         }
         else
         {
            _loc10_ = _loc3_.m_xf.R;
            _loc11_ = this.m_prismatic2.m_localXAxis1;
            _loc6_ = _loc10_.col1.x * _loc11_.x + _loc10_.col2.x * _loc11_.y;
            _loc7_ = _loc10_.col1.y * _loc11_.x + _loc10_.col2.y * _loc11_.y;
            _loc10_ = _loc5_.m_xf.R;
            _loc8_ = this.m_localAnchor2.x - _loc5_.m_sweep.localCenter.x;
            _loc9_ = this.m_localAnchor2.y - _loc5_.m_sweep.localCenter.y;
            _loc13_ = _loc10_.col1.x * _loc8_ + _loc10_.col2.x * _loc9_;
            _loc9_ = _loc10_.col1.y * _loc8_ + _loc10_.col2.y * _loc9_;
            _loc8_ = _loc13_;
            _loc12_ = _loc8_ * _loc7_ - _loc9_ * _loc6_;
            this.m_J.linear2.Set(-this.m_ratio * _loc6_,-this.m_ratio * _loc7_);
            this.m_J.angular2 = -this.m_ratio * _loc12_;
            _loc14_ += this.m_ratio * this.m_ratio * (_loc5_.m_invMass + _loc5_.m_invI * _loc12_ * _loc12_);
         }
         this.m_mass = 1 / _loc14_;
         if(param1.warmStarting)
         {
            _loc15_ = param1.dt * this.m_force;
            _loc4_.m_linearVelocity.x += _loc4_.m_invMass * _loc15_ * this.m_J.linear1.x;
            _loc4_.m_linearVelocity.y += _loc4_.m_invMass * _loc15_ * this.m_J.linear1.y;
            _loc4_.m_angularVelocity += _loc4_.m_invI * _loc15_ * this.m_J.angular1;
            _loc5_.m_linearVelocity.x += _loc5_.m_invMass * _loc15_ * this.m_J.linear2.x;
            _loc5_.m_linearVelocity.y += _loc5_.m_invMass * _loc15_ * this.m_J.linear2.y;
            _loc5_.m_angularVelocity += _loc5_.m_invI * _loc15_ * this.m_J.angular2;
         }
         else
         {
            this.m_force = 0;
         }
      
}
GetReactionTorque() {
         var _loc1_ = null;
         var _loc2_ = NaN;
         var _loc3_ = NaN;
         var _loc4_ = NaN;
         _loc1_ = this.m_body2.m_xf.R;
         _loc2_ = this.m_localAnchor1.x - this.m_body2.m_sweep.localCenter.x;
         _loc3_ = this.m_localAnchor1.y - this.m_body2.m_sweep.localCenter.y;
         _loc4_ = _loc1_.col1.x * _loc2_ + _loc1_.col2.x * _loc3_;
         _loc3_ = _loc1_.col1.y * _loc2_ + _loc1_.col2.y * _loc3_;
         _loc2_ = _loc4_;
         return this.m_force * this.m_J.angular2 - (_loc2_ * (this.m_force * this.m_J.linear2.y) - _loc3_ * (this.m_force * this.m_J.linear2.x));
      
}
GetRatio() {
         return this.m_ratio;
      
}
SolveVelocityConstraints(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         _loc2_ = this.m_body1;
         _loc3_ = this.m_body2;
         _loc4_ = this.m_J.Compute(_loc2_.m_linearVelocity,_loc2_.m_angularVelocity,_loc3_.m_linearVelocity,_loc3_.m_angularVelocity);
         _loc5_ = -param1.inv_dt * this.m_mass * _loc4_;
         this.m_force += _loc5_;
         _loc6_ = param1.dt * _loc5_;
         _loc2_.m_linearVelocity.x += _loc2_.m_invMass * _loc6_ * this.m_J.linear1.x;
         _loc2_.m_linearVelocity.y += _loc2_.m_invMass * _loc6_ * this.m_J.linear1.y;
         _loc2_.m_angularVelocity += _loc2_.m_invI * _loc6_ * this.m_J.angular1;
         _loc3_.m_linearVelocity.x += _loc3_.m_invMass * _loc6_ * this.m_J.linear2.x;
         _loc3_.m_linearVelocity.y += _loc3_.m_invMass * _loc6_ * this.m_J.linear2.y;
         _loc3_.m_angularVelocity += _loc3_.m_invI * _loc6_ * this.m_J.angular2;
      
}
}
class b2GearJointDef extends b2JointDef {
joint2 = null;
joint1 = null;
ratio = NaN;
constructor() {
         super();
         this.type = b2Joint.e_gearJoint;
         this.joint1 = null;
         this.joint2 = null;
         this.ratio = 1;
      
}
}
class b2MouseJoint extends b2Joint {
m_beta = NaN;
m_mass = new b2Mat22();
m_target = new b2Vec2();
m_impulse = new b2Vec2();
m_localAnchor = new b2Vec2();
K1 = new b2Mat22();
K2 = new b2Mat22();
K = new b2Mat22();
m_gamma = NaN;
m_C = new b2Vec2();
m_maxForce = NaN;
constructor(param1) {
         var _loc2_ = NaN;
         var _loc3_ = NaN;
         var _loc4_ = null;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         super(param1);
         this.m_target.SetV(param1.target);
         _loc2_ = this.m_target.x - this.m_body2.m_xf.position.x;
         _loc3_ = this.m_target.y - this.m_body2.m_xf.position.y;
         _loc4_ = this.m_body2.m_xf.R;
         this.m_localAnchor.x = _loc2_ * _loc4_.col1.x + _loc3_ * _loc4_.col1.y;
         this.m_localAnchor.y = _loc2_ * _loc4_.col2.x + _loc3_ * _loc4_.col2.y;
         this.m_maxForce = param1.maxForce;
         this.m_impulse.SetZero();
         _loc5_ = this.m_body2.m_mass;
         _loc6_ = 2 * b2Settings.b2_pi * param1.frequencyHz;
         _loc7_ = 2 * _loc5_ * param1.dampingRatio * _loc6_;
         _loc8_ = param1.timeStep * _loc5_ * (_loc6_ * _loc6_);
         this.m_gamma = 1 / (_loc7_ + _loc8_);
         this.m_beta = _loc8_ / (_loc7_ + _loc8_);
      
}
GetAnchor1() {
         return this.m_target;
      
}
GetAnchor2() {
         return this.m_body2.GetWorldPoint(this.m_localAnchor);
      
}
GetReactionForce() {
         return this.m_impulse;
      
}
SolvePositionConstraints() {
         return true;
      
}
InitVelocityConstraints(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         _loc2_ = this.m_body2;
         _loc3_ = _loc2_.m_xf.R;
         _loc4_ = this.m_localAnchor.x - _loc2_.m_sweep.localCenter.x;
         _loc5_ = this.m_localAnchor.y - _loc2_.m_sweep.localCenter.y;
         _loc6_ = _loc3_.col1.x * _loc4_ + _loc3_.col2.x * _loc5_;
         _loc5_ = _loc3_.col1.y * _loc4_ + _loc3_.col2.y * _loc5_;
         _loc4_ = _loc6_;
         _loc7_ = _loc2_.m_invMass;
         _loc8_ = _loc2_.m_invI;
         this.K1.col1.x = _loc7_;
         this.K1.col2.x = 0;
         this.K1.col1.y = 0;
         this.K1.col2.y = _loc7_;
         this.K2.col1.x = _loc8_ * _loc5_ * _loc5_;
         this.K2.col2.x = -_loc8_ * _loc4_ * _loc5_;
         this.K2.col1.y = -_loc8_ * _loc4_ * _loc5_;
         this.K2.col2.y = _loc8_ * _loc4_ * _loc4_;
         this.K.SetM(this.K1);
         this.K.AddM(this.K2);
         this.K.col1.x += this.m_gamma;
         this.K.col2.y += this.m_gamma;
         this.K.Invert(this.m_mass);
         this.m_C.x = _loc2_.m_sweep.c.x + _loc4_ - this.m_target.x;
         this.m_C.y = _loc2_.m_sweep.c.y + _loc5_ - this.m_target.y;
         _loc2_.m_angularVelocity *= 0.98;
         _loc9_ = param1.dt * this.m_impulse.x;
         _loc10_ = param1.dt * this.m_impulse.y;
         _loc2_.m_linearVelocity.x += _loc7_ * _loc9_;
         _loc2_.m_linearVelocity.y += _loc7_ * _loc10_;
         _loc2_.m_angularVelocity += _loc8_ * (_loc4_ * _loc10_ - _loc5_ * _loc9_);
      
}
GetReactionTorque() {
         return 0;
      
}
SetTarget(param1) {
         if(this.m_body2.IsSleeping())
         {
            this.m_body2.WakeUp();
         }
         this.m_target = param1;
      
}
SolveVelocityConstraints(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         _loc2_ = this.m_body2;
         _loc3_ = _loc2_.m_xf.R;
         _loc6_ = this.m_localAnchor.x - _loc2_.m_sweep.localCenter.x;
         _loc7_ = this.m_localAnchor.y - _loc2_.m_sweep.localCenter.y;
         _loc4_ = _loc3_.col1.x * _loc6_ + _loc3_.col2.x * _loc7_;
         _loc7_ = _loc3_.col1.y * _loc6_ + _loc3_.col2.y * _loc7_;
         _loc6_ = _loc4_;
         _loc8_ = _loc2_.m_linearVelocity.x + -_loc2_.m_angularVelocity * _loc7_;
         _loc9_ = _loc2_.m_linearVelocity.y + _loc2_.m_angularVelocity * _loc6_;
         _loc3_ = this.m_mass;
         _loc4_ = _loc8_ + this.m_beta * param1.inv_dt * this.m_C.x + this.m_gamma * param1.dt * this.m_impulse.x;
         _loc5_ = _loc9_ + this.m_beta * param1.inv_dt * this.m_C.y + this.m_gamma * param1.dt * this.m_impulse.y;
         _loc10_ = -param1.inv_dt * (_loc3_.col1.x * _loc4_ + _loc3_.col2.x * _loc5_);
         _loc11_ = -param1.inv_dt * (_loc3_.col1.y * _loc4_ + _loc3_.col2.y * _loc5_);
         _loc12_ = this.m_impulse.x;
         _loc13_ = this.m_impulse.y;
         this.m_impulse.x += _loc10_;
         this.m_impulse.y += _loc11_;
         _loc14_ = this.m_impulse.Length();
         if(_loc14_ > this.m_maxForce)
         {
            this.m_impulse.Multiply(this.m_maxForce / _loc14_);
         }
         _loc10_ = this.m_impulse.x - _loc12_;
         _loc11_ = this.m_impulse.y - _loc13_;
         _loc15_ = param1.dt * _loc10_;
         _loc16_ = param1.dt * _loc11_;
         _loc2_.m_linearVelocity.x += _loc2_.m_invMass * _loc15_;
         _loc2_.m_linearVelocity.y += _loc2_.m_invMass * _loc16_;
         _loc2_.m_angularVelocity += _loc2_.m_invI * (_loc6_ * _loc16_ - _loc7_ * _loc15_);
      
}
}
class b2MouseJointDef extends b2JointDef {
frequencyHz = NaN;
dampingRatio = NaN;
maxForce = NaN;
target = new b2Vec2();
timeStep = NaN;
constructor() {
         super();
         this.type = b2Joint.e_mouseJoint;
         this.maxForce = 0;
         this.frequencyHz = 5;
         this.dampingRatio = 0.7;
         this.timeStep = 1 / 60;
      
}
}
class b2PrismaticJoint extends b2Joint {
m_limitForce = NaN;
m_refAngle = NaN;
m_lowerTranslation = NaN;
m_localXAxis1 = new b2Vec2();
m_torque = NaN;
m_enableLimit = false;
m_motorForce = NaN;
m_force = NaN;
m_localYAxis1 = new b2Vec2();
m_motorMass = NaN;
m_maxMotorForce = NaN;
m_localAnchor1 = new b2Vec2();
m_localAnchor2 = new b2Vec2();
m_angularMass = NaN;
m_limitState = 0;
m_linearMass = NaN;
m_upperTranslation = NaN;
m_motorJacobian = new b2Jacobian();
m_limitPositionImpulse = NaN;
m_motorSpeed = NaN;
m_linearJacobian = new b2Jacobian();
m_enableMotor = false;
constructor(param1) {
         var _loc3_ = NaN;
         var _loc4_ = NaN;
         super(param1);
         this.m_localAnchor1.SetV(param1.localAnchor1);
         this.m_localAnchor2.SetV(param1.localAnchor2);
         this.m_localXAxis1.SetV(param1.localAxis1);
         this.m_localYAxis1.x = -this.m_localXAxis1.y;
         this.m_localYAxis1.y = this.m_localXAxis1.x;
         this.m_refAngle = param1.referenceAngle;
         this.m_linearJacobian.SetZero();
         this.m_linearMass = 0;
         this.m_force = 0;
         this.m_angularMass = 0;
         this.m_torque = 0;
         this.m_motorJacobian.SetZero();
         this.m_motorMass = 0;
         this.m_motorForce = 0;
         this.m_limitForce = 0;
         this.m_limitPositionImpulse = 0;
         this.m_lowerTranslation = param1.lowerTranslation;
         this.m_upperTranslation = param1.upperTranslation;
         this.m_maxMotorForce = param1.maxMotorForce;
         this.m_motorSpeed = param1.motorSpeed;
         this.m_enableLimit = param1.enableLimit;
         this.m_enableMotor = param1.enableMotor;
      
}
GetAnchor1() {
         return this.m_body1.GetWorldPoint(this.m_localAnchor1);
      
}
GetAnchor2() {
         return this.m_body2.GetWorldPoint(this.m_localAnchor2);
      
}
EnableMotor(param1) {
         this.m_enableMotor = param1;
      
}
GetUpperLimit() {
         return this.m_upperTranslation;
      
}
GetLowerLimit() {
         return this.m_lowerTranslation;
      
}
GetJointTranslation() {
         var _loc1_ = null;
         var _loc2_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = null;
         var _loc9_ = NaN;
         _loc1_ = this.m_body1;
         _loc2_ = this.m_body2;
         _loc4_ = _loc1_.GetWorldPoint(this.m_localAnchor1);
         _loc5_ = _loc2_.GetWorldPoint(this.m_localAnchor2);
         _loc6_ = _loc5_.x - _loc4_.x;
         _loc7_ = _loc5_.y - _loc4_.y;
         _loc8_ = _loc1_.GetWorldVector(this.m_localXAxis1);
         return _loc8_.x * _loc6_ + _loc8_.y * _loc7_;
      
}
SetLimits(param1, param2) {
         this.m_lowerTranslation = param1;
         this.m_upperTranslation = param2;
      
}
GetMotorSpeed() {
         return this.m_motorSpeed;
      
}
GetReactionForce() {
         var _loc1_ = null;
         var _loc2_ = NaN;
         var _loc3_ = NaN;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         _loc1_ = this.m_body1.m_xf.R;
         _loc2_ = this.m_limitForce * (_loc1_.col1.x * this.m_localXAxis1.x + _loc1_.col2.x * this.m_localXAxis1.y);
         _loc3_ = this.m_limitForce * (_loc1_.col1.y * this.m_localXAxis1.x + _loc1_.col2.y * this.m_localXAxis1.y);
         _loc4_ = this.m_force * (_loc1_.col1.x * this.m_localYAxis1.x + _loc1_.col2.x * this.m_localYAxis1.y);
         _loc5_ = this.m_force * (_loc1_.col1.y * this.m_localYAxis1.x + _loc1_.col2.y * this.m_localYAxis1.y);
         return new b2Vec2(this.m_limitForce * _loc2_ + this.m_force * _loc4_,this.m_limitForce * _loc3_ + this.m_force * _loc5_);
      
}
SolvePositionConstraints() {
         var _loc1_ = NaN;
         var _loc2_ = NaN;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = null;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         var _loc22_ = NaN;
         var _loc23_ = NaN;
         var _loc24_ = NaN;
         var _loc25_ = NaN;
         var _loc26_ = NaN;
         var _loc27_ = NaN;
         var _loc28_ = NaN;
         var _loc29_ = NaN;
         var _loc30_ = NaN;
         var _loc31_ = NaN;
         var _loc32_ = NaN;
         _loc3_ = this.m_body1;
         _loc4_ = this.m_body2;
         _loc5_ = _loc3_.m_invMass;
         _loc6_ = _loc4_.m_invMass;
         _loc7_ = _loc3_.m_invI;
         _loc8_ = _loc4_.m_invI;
         _loc9_ = _loc3_.m_xf.R;
         _loc11_ = this.m_localAnchor1.x - _loc3_.m_sweep.localCenter.x;
         _loc12_ = this.m_localAnchor1.y - _loc3_.m_sweep.localCenter.y;
         _loc10_ = _loc9_.col1.x * _loc11_ + _loc9_.col2.x * _loc12_;
         _loc12_ = _loc9_.col1.y * _loc11_ + _loc9_.col2.y * _loc12_;
         _loc11_ = _loc10_;
         _loc9_ = _loc4_.m_xf.R;
         _loc13_ = this.m_localAnchor2.x - _loc4_.m_sweep.localCenter.x;
         _loc14_ = this.m_localAnchor2.y - _loc4_.m_sweep.localCenter.y;
         _loc10_ = _loc9_.col1.x * _loc13_ + _loc9_.col2.x * _loc14_;
         _loc14_ = _loc9_.col1.y * _loc13_ + _loc9_.col2.y * _loc14_;
         _loc13_ = _loc10_;
         _loc15_ = _loc3_.m_sweep.c.x + _loc11_;
         _loc16_ = _loc3_.m_sweep.c.y + _loc12_;
         _loc17_ = _loc4_.m_sweep.c.x + _loc13_;
         _loc18_ = _loc4_.m_sweep.c.y + _loc14_;
         _loc19_ = _loc17_ - _loc15_;
         _loc20_ = _loc18_ - _loc16_;
         _loc9_ = _loc3_.m_xf.R;
         _loc21_ = _loc9_.col1.x * this.m_localYAxis1.x + _loc9_.col2.x * this.m_localYAxis1.y;
         _loc22_ = _loc9_.col1.y * this.m_localYAxis1.x + _loc9_.col2.y * this.m_localYAxis1.y;
         _loc23_ = _loc21_ * _loc19_ + _loc22_ * _loc20_;
         _loc23_ = b2Math.b2Clamp(_loc23_,-b2Settings.b2_maxLinearCorrection,b2Settings.b2_maxLinearCorrection);
         _loc24_ = -this.m_linearMass * _loc23_;
         _loc3_.m_sweep.c.x += _loc5_ * _loc24_ * this.m_linearJacobian.linear1.x;
         _loc3_.m_sweep.c.y += _loc5_ * _loc24_ * this.m_linearJacobian.linear1.y;
         _loc3_.m_sweep.a += _loc7_ * _loc24_ * this.m_linearJacobian.angular1;
         _loc4_.m_sweep.c.x += _loc6_ * _loc24_ * this.m_linearJacobian.linear2.x;
         _loc4_.m_sweep.c.y += _loc6_ * _loc24_ * this.m_linearJacobian.linear2.y;
         _loc4_.m_sweep.a += _loc8_ * _loc24_ * this.m_linearJacobian.angular2;
         _loc25_ = b2Math.b2Abs(_loc23_);
         _loc26_ = _loc4_.m_sweep.a - _loc3_.m_sweep.a - this.m_refAngle;
         _loc26_ = b2Math.b2Clamp(_loc26_,-b2Settings.b2_maxAngularCorrection,b2Settings.b2_maxAngularCorrection);
         _loc27_ = -this.m_angularMass * _loc26_;
         _loc3_.m_sweep.a -= _loc3_.m_invI * _loc27_;
         _loc4_.m_sweep.a += _loc4_.m_invI * _loc27_;
         _loc3_.SynchronizeTransform();
         _loc4_.SynchronizeTransform();
         _loc28_ = b2Math.b2Abs(_loc26_);
         if(this.m_enableLimit && this.m_limitState != b2Joint.e_inactiveLimit)
         {
            _loc9_ = _loc3_.m_xf.R;
            _loc11_ = this.m_localAnchor1.x - _loc3_.m_sweep.localCenter.x;
            _loc12_ = this.m_localAnchor1.y - _loc3_.m_sweep.localCenter.y;
            _loc10_ = _loc9_.col1.x * _loc11_ + _loc9_.col2.x * _loc12_;
            _loc12_ = _loc9_.col1.y * _loc11_ + _loc9_.col2.y * _loc12_;
            _loc11_ = _loc10_;
            _loc9_ = _loc4_.m_xf.R;
            _loc13_ = this.m_localAnchor2.x - _loc4_.m_sweep.localCenter.x;
            _loc14_ = this.m_localAnchor2.y - _loc4_.m_sweep.localCenter.y;
            _loc10_ = _loc9_.col1.x * _loc13_ + _loc9_.col2.x * _loc14_;
            _loc14_ = _loc9_.col1.y * _loc13_ + _loc9_.col2.y * _loc14_;
            _loc13_ = _loc10_;
            _loc15_ = _loc3_.m_sweep.c.x + _loc11_;
            _loc16_ = _loc3_.m_sweep.c.y + _loc12_;
            _loc17_ = _loc4_.m_sweep.c.x + _loc13_;
            _loc18_ = _loc4_.m_sweep.c.y + _loc14_;
            _loc19_ = _loc17_ - _loc15_;
            _loc20_ = _loc18_ - _loc16_;
            _loc9_ = _loc3_.m_xf.R;
            _loc29_ = _loc9_.col1.x * this.m_localXAxis1.x + _loc9_.col2.x * this.m_localXAxis1.y;
            _loc30_ = _loc9_.col1.y * this.m_localXAxis1.x + _loc9_.col2.y * this.m_localXAxis1.y;
            _loc31_ = _loc29_ * _loc19_ + _loc30_ * _loc20_;
            _loc32_ = 0;
            if(this.m_limitState == b2Joint.e_equalLimits)
            {
               _loc1_ = b2Math.b2Clamp(_loc31_,-b2Settings.b2_maxLinearCorrection,b2Settings.b2_maxLinearCorrection);
               _loc32_ = -this.m_motorMass * _loc1_;
               _loc25_ = b2Math.b2Max(_loc25_,b2Math.b2Abs(_loc26_));
            }
            else if(this.m_limitState == b2Joint.e_atLowerLimit)
            {
               _loc1_ = _loc31_ - this.m_lowerTranslation;
               _loc25_ = b2Math.b2Max(_loc25_,-_loc1_);
               _loc1_ = b2Math.b2Clamp(_loc1_ + b2Settings.b2_linearSlop,-b2Settings.b2_maxLinearCorrection,0);
               _loc32_ = -this.m_motorMass * _loc1_;
               _loc2_ = this.m_limitPositionImpulse;
               this.m_limitPositionImpulse = b2Math.b2Max(this.m_limitPositionImpulse + _loc32_,0);
               _loc32_ = this.m_limitPositionImpulse - _loc2_;
            }
            else if(this.m_limitState == b2Joint.e_atUpperLimit)
            {
               _loc1_ = _loc31_ - this.m_upperTranslation;
               _loc25_ = b2Math.b2Max(_loc25_,_loc1_);
               _loc1_ = b2Math.b2Clamp(_loc1_ - b2Settings.b2_linearSlop,0,b2Settings.b2_maxLinearCorrection);
               _loc32_ = -this.m_motorMass * _loc1_;
               _loc2_ = this.m_limitPositionImpulse;
               this.m_limitPositionImpulse = b2Math.b2Min(this.m_limitPositionImpulse + _loc32_,0);
               _loc32_ = this.m_limitPositionImpulse - _loc2_;
            }
            _loc3_.m_sweep.c.x += _loc5_ * _loc32_ * this.m_motorJacobian.linear1.x;
            _loc3_.m_sweep.c.y += _loc5_ * _loc32_ * this.m_motorJacobian.linear1.y;
            _loc3_.m_sweep.a += _loc7_ * _loc32_ * this.m_motorJacobian.angular1;
            _loc4_.m_sweep.c.x += _loc6_ * _loc32_ * this.m_motorJacobian.linear2.x;
            _loc4_.m_sweep.c.y += _loc6_ * _loc32_ * this.m_motorJacobian.linear2.y;
            _loc4_.m_sweep.a += _loc8_ * _loc32_ * this.m_motorJacobian.angular2;
            _loc3_.SynchronizeTransform();
            _loc4_.SynchronizeTransform();
         }
         return _loc25_ <= b2Settings.b2_linearSlop && _loc28_ <= b2Settings.b2_angularSlop;
      
}
GetJointSpeed() {
         var _loc1_ = null;
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = null;
         var _loc16_ = null;
         var _loc17_ = null;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         _loc1_ = this.m_body1;
         _loc2_ = this.m_body2;
         _loc3_ = _loc1_.m_xf.R;
         _loc4_ = this.m_localAnchor1.x - _loc1_.m_sweep.localCenter.x;
         _loc5_ = this.m_localAnchor1.y - _loc1_.m_sweep.localCenter.y;
         _loc6_ = _loc3_.col1.x * _loc4_ + _loc3_.col2.x * _loc5_;
         _loc5_ = _loc3_.col1.y * _loc4_ + _loc3_.col2.y * _loc5_;
         _loc4_ = _loc6_;
         _loc3_ = _loc2_.m_xf.R;
         _loc7_ = this.m_localAnchor2.x - _loc2_.m_sweep.localCenter.x;
         _loc8_ = this.m_localAnchor2.y - _loc2_.m_sweep.localCenter.y;
         _loc6_ = _loc3_.col1.x * _loc7_ + _loc3_.col2.x * _loc8_;
         _loc8_ = _loc3_.col1.y * _loc7_ + _loc3_.col2.y * _loc8_;
         _loc7_ = _loc6_;
         _loc9_ = _loc1_.m_sweep.c.x + _loc4_;
         _loc10_ = _loc1_.m_sweep.c.y + _loc5_;
         _loc11_ = _loc2_.m_sweep.c.x + _loc7_;
         _loc12_ = _loc2_.m_sweep.c.y + _loc8_;
         _loc13_ = _loc11_ - _loc9_;
         _loc14_ = _loc12_ - _loc10_;
         _loc15_ = _loc1_.GetWorldVector(this.m_localXAxis1);
         _loc16_ = _loc1_.m_linearVelocity;
         _loc17_ = _loc2_.m_linearVelocity;
         _loc18_ = _loc1_.m_angularVelocity;
         _loc19_ = _loc2_.m_angularVelocity;
         return _loc13_ * (-_loc18_ * _loc15_.y) + _loc14_ * (_loc18_ * _loc15_.x) + (_loc15_.x * (_loc17_.x + -_loc19_ * _loc8_ - _loc16_.x - -_loc18_ * _loc5_) + _loc15_.y * (_loc17_.y + _loc19_ * _loc7_ - _loc16_.y - _loc18_ * _loc4_));
      
}
SetMotorSpeed(param1) {
         this.m_motorSpeed = param1;
      
}
InitVelocityConstraints(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         var _loc22_ = NaN;
         var _loc23_ = NaN;
         var _loc24_ = NaN;
         var _loc25_ = NaN;
         var _loc26_ = NaN;
         var _loc27_ = NaN;
         var _loc28_ = NaN;
         _loc2_ = this.m_body1;
         _loc3_ = this.m_body2;
         _loc4_ = _loc2_.m_xf.R;
         _loc6_ = this.m_localAnchor1.x - _loc2_.m_sweep.localCenter.x;
         _loc7_ = this.m_localAnchor1.y - _loc2_.m_sweep.localCenter.y;
         _loc5_ = _loc4_.col1.x * _loc6_ + _loc4_.col2.x * _loc7_;
         _loc7_ = _loc4_.col1.y * _loc6_ + _loc4_.col2.y * _loc7_;
         _loc6_ = _loc5_;
         _loc4_ = _loc3_.m_xf.R;
         _loc8_ = this.m_localAnchor2.x - _loc3_.m_sweep.localCenter.x;
         _loc9_ = this.m_localAnchor2.y - _loc3_.m_sweep.localCenter.y;
         _loc5_ = _loc4_.col1.x * _loc8_ + _loc4_.col2.x * _loc9_;
         _loc9_ = _loc4_.col1.y * _loc8_ + _loc4_.col2.y * _loc9_;
         _loc8_ = _loc5_;
         _loc10_ = _loc2_.m_invMass;
         _loc11_ = _loc3_.m_invMass;
         _loc12_ = _loc2_.m_invI;
         _loc13_ = _loc3_.m_invI;
         _loc4_ = _loc2_.m_xf.R;
         _loc14_ = _loc4_.col1.x * this.m_localYAxis1.x + _loc4_.col2.x * this.m_localYAxis1.y;
         _loc15_ = _loc4_.col1.y * this.m_localYAxis1.x + _loc4_.col2.y * this.m_localYAxis1.y;
         _loc16_ = _loc3_.m_sweep.c.x + _loc8_ - _loc2_.m_sweep.c.x;
         _loc17_ = _loc3_.m_sweep.c.y + _loc9_ - _loc2_.m_sweep.c.y;
         this.m_linearJacobian.linear1.x = -_loc14_;
         this.m_linearJacobian.linear1.y = -_loc15_;
         this.m_linearJacobian.linear2.x = _loc14_;
         this.m_linearJacobian.linear2.y = _loc15_;
         this.m_linearJacobian.angular1 = -(_loc16_ * _loc15_ - _loc17_ * _loc14_);
         this.m_linearJacobian.angular2 = _loc8_ * _loc15_ - _loc9_ * _loc14_;
         this.m_linearMass = _loc10_ + _loc12_ * this.m_linearJacobian.angular1 * this.m_linearJacobian.angular1 + _loc11_ + _loc13_ * this.m_linearJacobian.angular2 * this.m_linearJacobian.angular2;
         this.m_linearMass = 1 / this.m_linearMass;
         this.m_angularMass = _loc12_ + _loc13_;
         if(this.m_angularMass > Number.MIN_VALUE)
         {
            this.m_angularMass = 1 / this.m_angularMass;
         }
         if(this.m_enableLimit || this.m_enableMotor)
         {
            _loc4_ = _loc2_.m_xf.R;
            _loc18_ = _loc4_.col1.x * this.m_localXAxis1.x + _loc4_.col2.x * this.m_localXAxis1.y;
            _loc19_ = _loc4_.col1.y * this.m_localXAxis1.x + _loc4_.col2.y * this.m_localXAxis1.y;
            this.m_motorJacobian.linear1.x = -_loc18_;
            this.m_motorJacobian.linear1.y = -_loc19_;
            this.m_motorJacobian.linear2.x = _loc18_;
            this.m_motorJacobian.linear2.y = _loc19_;
            this.m_motorJacobian.angular1 = -(_loc16_ * _loc19_ - _loc17_ * _loc18_);
            this.m_motorJacobian.angular2 = _loc8_ * _loc19_ - _loc9_ * _loc18_;
            this.m_motorMass = _loc10_ + _loc12_ * this.m_motorJacobian.angular1 * this.m_motorJacobian.angular1 + _loc11_ + _loc13_ * this.m_motorJacobian.angular2 * this.m_motorJacobian.angular2;
            this.m_motorMass = 1 / this.m_motorMass;
            if(this.m_enableLimit)
            {
               _loc20_ = _loc16_ - _loc6_;
               _loc21_ = _loc17_ - _loc7_;
               _loc22_ = _loc18_ * _loc20_ + _loc19_ * _loc21_;
               if(b2Math.b2Abs(this.m_upperTranslation - this.m_lowerTranslation) < 2 * b2Settings.b2_linearSlop)
               {
                  this.m_limitState = int(b2Joint.e_equalLimits);
               }
               else if(_loc22_ <= this.m_lowerTranslation)
               {
                  if(this.m_limitState != b2Joint.e_atLowerLimit)
                  {
                     this.m_limitForce = 0;
                  }
                  this.m_limitState = int(b2Joint.e_atLowerLimit);
               }
               else if(_loc22_ >= this.m_upperTranslation)
               {
                  if(this.m_limitState != b2Joint.e_atUpperLimit)
                  {
                     this.m_limitForce = 0;
                  }
                  this.m_limitState = int(b2Joint.e_atUpperLimit);
               }
               else
               {
                  this.m_limitState = int(b2Joint.e_inactiveLimit);
                  this.m_limitForce = 0;
               }
            }
         }
         if(this.m_enableMotor == false)
         {
            this.m_motorForce = 0;
         }
         if(this.m_enableLimit == false)
         {
            this.m_limitForce = 0;
         }
         if(param1.warmStarting)
         {
            _loc23_ = param1.dt * (this.m_force * this.m_linearJacobian.linear1.x + (this.m_motorForce + this.m_limitForce) * this.m_motorJacobian.linear1.x);
            _loc24_ = param1.dt * (this.m_force * this.m_linearJacobian.linear1.y + (this.m_motorForce + this.m_limitForce) * this.m_motorJacobian.linear1.y);
            _loc25_ = param1.dt * (this.m_force * this.m_linearJacobian.linear2.x + (this.m_motorForce + this.m_limitForce) * this.m_motorJacobian.linear2.x);
            _loc26_ = param1.dt * (this.m_force * this.m_linearJacobian.linear2.y + (this.m_motorForce + this.m_limitForce) * this.m_motorJacobian.linear2.y);
            _loc27_ = param1.dt * (this.m_force * this.m_linearJacobian.angular1 - this.m_torque + (this.m_motorForce + this.m_limitForce) * this.m_motorJacobian.angular1);
            _loc28_ = param1.dt * (this.m_force * this.m_linearJacobian.angular2 + this.m_torque + (this.m_motorForce + this.m_limitForce) * this.m_motorJacobian.angular2);
            _loc2_.m_linearVelocity.x += _loc10_ * _loc23_;
            _loc2_.m_linearVelocity.y += _loc10_ * _loc24_;
            _loc2_.m_angularVelocity += _loc12_ * _loc27_;
            _loc3_.m_linearVelocity.x += _loc11_ * _loc25_;
            _loc3_.m_linearVelocity.y += _loc11_ * _loc26_;
            _loc3_.m_angularVelocity += _loc13_ * _loc28_;
         }
         else
         {
            this.m_force = 0;
            this.m_torque = 0;
            this.m_limitForce = 0;
            this.m_motorForce = 0;
         }
         this.m_limitPositionImpulse = 0;
      
}
GetMotorForce() {
         return this.m_motorForce;
      
}
SetMaxMotorForce(param1) {
         this.m_maxMotorForce = param1;
      
}
EnableLimit(param1) {
         this.m_enableLimit = param1;
      
}
GetReactionTorque() {
         return this.m_torque;
      
}
IsLimitEnabled() {
         return this.m_enableLimit;
      
}
IsMotorEnabled() {
         return this.m_enableMotor;
      
}
SolveVelocityConstraints(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         _loc2_ = this.m_body1;
         _loc3_ = this.m_body2;
         _loc4_ = _loc2_.m_invMass;
         _loc5_ = _loc3_.m_invMass;
         _loc6_ = _loc2_.m_invI;
         _loc7_ = _loc3_.m_invI;
         _loc9_ = this.m_linearJacobian.Compute(_loc2_.m_linearVelocity,_loc2_.m_angularVelocity,_loc3_.m_linearVelocity,_loc3_.m_angularVelocity);
         _loc10_ = -param1.inv_dt * this.m_linearMass * _loc9_;
         this.m_force += _loc10_;
         _loc11_ = param1.dt * _loc10_;
         _loc2_.m_linearVelocity.x += _loc4_ * _loc11_ * this.m_linearJacobian.linear1.x;
         _loc2_.m_linearVelocity.y += _loc4_ * _loc11_ * this.m_linearJacobian.linear1.y;
         _loc2_.m_angularVelocity += _loc6_ * _loc11_ * this.m_linearJacobian.angular1;
         _loc3_.m_linearVelocity.x += _loc5_ * _loc11_ * this.m_linearJacobian.linear2.x;
         _loc3_.m_linearVelocity.y += _loc5_ * _loc11_ * this.m_linearJacobian.linear2.y;
         _loc3_.m_angularVelocity += _loc7_ * _loc11_ * this.m_linearJacobian.angular2;
         _loc12_ = _loc3_.m_angularVelocity - _loc2_.m_angularVelocity;
         _loc13_ = -param1.inv_dt * this.m_angularMass * _loc12_;
         this.m_torque += _loc13_;
         _loc14_ = param1.dt * _loc13_;
         _loc2_.m_angularVelocity -= _loc6_ * _loc14_;
         _loc3_.m_angularVelocity += _loc7_ * _loc14_;
         if(this.m_enableMotor && this.m_limitState != b2Joint.e_equalLimits)
         {
            _loc15_ = this.m_motorJacobian.Compute(_loc2_.m_linearVelocity,_loc2_.m_angularVelocity,_loc3_.m_linearVelocity,_loc3_.m_angularVelocity) - this.m_motorSpeed;
            _loc16_ = -param1.inv_dt * this.m_motorMass * _loc15_;
            _loc17_ = this.m_motorForce;
            this.m_motorForce = b2Math.b2Clamp(this.m_motorForce + _loc16_,-this.m_maxMotorForce,this.m_maxMotorForce);
            _loc16_ = this.m_motorForce - _loc17_;
            _loc11_ = param1.dt * _loc16_;
            _loc2_.m_linearVelocity.x += _loc4_ * _loc11_ * this.m_motorJacobian.linear1.x;
            _loc2_.m_linearVelocity.y += _loc4_ * _loc11_ * this.m_motorJacobian.linear1.y;
            _loc2_.m_angularVelocity += _loc6_ * _loc11_ * this.m_motorJacobian.angular1;
            _loc3_.m_linearVelocity.x += _loc5_ * _loc11_ * this.m_motorJacobian.linear2.x;
            _loc3_.m_linearVelocity.y += _loc5_ * _loc11_ * this.m_motorJacobian.linear2.y;
            _loc3_.m_angularVelocity += _loc7_ * _loc11_ * this.m_motorJacobian.angular2;
         }
         if(this.m_enableLimit && this.m_limitState != b2Joint.e_inactiveLimit)
         {
            _loc18_ = this.m_motorJacobian.Compute(_loc2_.m_linearVelocity,_loc2_.m_angularVelocity,_loc3_.m_linearVelocity,_loc3_.m_angularVelocity);
            _loc19_ = -param1.inv_dt * this.m_motorMass * _loc18_;
            if(this.m_limitState == b2Joint.e_equalLimits)
            {
               this.m_limitForce += _loc19_;
            }
            else if(this.m_limitState == b2Joint.e_atLowerLimit)
            {
               _loc8_ = this.m_limitForce;
               this.m_limitForce = b2Math.b2Max(this.m_limitForce + _loc19_,0);
               _loc19_ = this.m_limitForce - _loc8_;
            }
            else if(this.m_limitState == b2Joint.e_atUpperLimit)
            {
               _loc8_ = this.m_limitForce;
               this.m_limitForce = b2Math.b2Min(this.m_limitForce + _loc19_,0);
               _loc19_ = this.m_limitForce - _loc8_;
            }
            _loc11_ = param1.dt * _loc19_;
            _loc2_.m_linearVelocity.x += _loc4_ * _loc11_ * this.m_motorJacobian.linear1.x;
            _loc2_.m_linearVelocity.y += _loc4_ * _loc11_ * this.m_motorJacobian.linear1.y;
            _loc2_.m_angularVelocity += _loc6_ * _loc11_ * this.m_motorJacobian.angular1;
            _loc3_.m_linearVelocity.x += _loc5_ * _loc11_ * this.m_motorJacobian.linear2.x;
            _loc3_.m_linearVelocity.y += _loc5_ * _loc11_ * this.m_motorJacobian.linear2.y;
            _loc3_.m_angularVelocity += _loc7_ * _loc11_ * this.m_motorJacobian.angular2;
         }
      
}
}
class b2PrismaticJointDef extends b2JointDef {
localAxis1 = new b2Vec2();
referenceAngle = NaN;
maxMotorForce = NaN;
motorSpeed = NaN;
upperTranslation = NaN;
localAnchor1 = new b2Vec2();
localAnchor2 = new b2Vec2();
enableLimit = false;
enableMotor = false;
lowerTranslation = NaN;
constructor() {
         super();
         this.type = b2Joint.e_prismaticJoint;
         this.localAxis1.Set(1,0);
         this.referenceAngle = 0;
         this.enableLimit = false;
         this.lowerTranslation = 0;
         this.upperTranslation = 0;
         this.enableMotor = false;
         this.maxMotorForce = 0;
         this.motorSpeed = 0;
      
}
Initialize(param1, param2, param3, param4) {
         this.body1 = param1;
         this.body2 = param2;
         this.localAnchor1 = this.body1.GetLocalPoint(param3);
         this.localAnchor2 = this.body2.GetLocalPoint(param3);
         this.localAxis1 = this.body1.GetLocalVector(param4);
         this.referenceAngle = this.body2.GetAngle() - this.body1.GetAngle();
      
}
}
class b2PulleyJoint extends b2Joint {
static b2_minPulleyLength;
m_ground = null;
m_maxLength2 = NaN;
m_limitForce1 = NaN;
m_maxLength1 = NaN;
m_limitState1 = 0;
m_limitState2 = 0;
m_limitPositionImpulse2 = NaN;
m_force = NaN;
m_limitPositionImpulse1 = NaN;
m_constant = NaN;
m_state = 0;
m_ratio = NaN;
m_groundAnchor1 = new b2Vec2();
m_groundAnchor2 = new b2Vec2();
m_localAnchor1 = new b2Vec2();
m_localAnchor2 = new b2Vec2();
m_positionImpulse = NaN;
m_limitMass2 = NaN;
m_limitMass1 = NaN;
m_pulleyMass = NaN;
m_u1 = new b2Vec2();
m_u2 = new b2Vec2();
m_limitForce2 = NaN;
constructor(param1) {
         var _loc3_ = NaN;
         var _loc4_ = NaN;
         super(param1);
         this.m_ground = this.m_body1.m_world.m_groundBody;
         this.m_groundAnchor1.x = param1.groundAnchor1.x - this.m_ground.m_xf.position.x;
         this.m_groundAnchor1.y = param1.groundAnchor1.y - this.m_ground.m_xf.position.y;
         this.m_groundAnchor2.x = param1.groundAnchor2.x - this.m_ground.m_xf.position.x;
         this.m_groundAnchor2.y = param1.groundAnchor2.y - this.m_ground.m_xf.position.y;
         this.m_localAnchor1.SetV(param1.localAnchor1);
         this.m_localAnchor2.SetV(param1.localAnchor2);
         this.m_ratio = param1.ratio;
         this.m_constant = param1.length1 + this.m_ratio * param1.length2;
         this.m_maxLength1 = b2Math.b2Min(param1.maxLength1,this.m_constant - this.m_ratio * b2PulleyJoint.b2_minPulleyLength);
         this.m_maxLength2 = b2Math.b2Min(param1.maxLength2,(this.m_constant - b2PulleyJoint.b2_minPulleyLength) / this.m_ratio);
         this.m_force = 0;
         this.m_limitForce1 = 0;
         this.m_limitForce2 = 0;
      
}
GetGroundAnchor2() {
         var _loc1_ = null;
         _loc1_ = this.m_ground.m_xf.position.Copy();
         _loc1_.Add(this.m_groundAnchor2);
         return _loc1_;
      
}
GetAnchor1() {
         return this.m_body1.GetWorldPoint(this.m_localAnchor1);
      
}
GetAnchor2() {
         return this.m_body2.GetWorldPoint(this.m_localAnchor2);
      
}
GetReactionForce() {
         var _loc1_ = null;
         _loc1_ = this.m_u2.Copy();
         _loc1_.Multiply(this.m_force);
         return _loc1_;
      
}
SolvePositionConstraints() {
         var _loc1_ = null;
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         var _loc22_ = NaN;
         var _loc23_ = NaN;
         _loc1_ = this.m_body1;
         _loc2_ = this.m_body2;
         _loc4_ = this.m_ground.m_xf.position.x + this.m_groundAnchor1.x;
         _loc5_ = this.m_ground.m_xf.position.y + this.m_groundAnchor1.y;
         _loc6_ = this.m_ground.m_xf.position.x + this.m_groundAnchor2.x;
         _loc7_ = this.m_ground.m_xf.position.y + this.m_groundAnchor2.y;
         _loc23_ = 0;
         if(this.m_state == b2Joint.e_atUpperLimit)
         {
            _loc3_ = _loc1_.m_xf.R;
            _loc8_ = this.m_localAnchor1.x - _loc1_.m_sweep.localCenter.x;
            _loc9_ = this.m_localAnchor1.y - _loc1_.m_sweep.localCenter.y;
            _loc22_ = _loc3_.col1.x * _loc8_ + _loc3_.col2.x * _loc9_;
            _loc9_ = _loc3_.col1.y * _loc8_ + _loc3_.col2.y * _loc9_;
            _loc8_ = _loc22_;
            _loc3_ = _loc2_.m_xf.R;
            _loc10_ = this.m_localAnchor2.x - _loc2_.m_sweep.localCenter.x;
            _loc11_ = this.m_localAnchor2.y - _loc2_.m_sweep.localCenter.y;
            _loc22_ = _loc3_.col1.x * _loc10_ + _loc3_.col2.x * _loc11_;
            _loc11_ = _loc3_.col1.y * _loc10_ + _loc3_.col2.y * _loc11_;
            _loc10_ = _loc22_;
            _loc12_ = _loc1_.m_sweep.c.x + _loc8_;
            _loc13_ = _loc1_.m_sweep.c.y + _loc9_;
            _loc14_ = _loc2_.m_sweep.c.x + _loc10_;
            _loc15_ = _loc2_.m_sweep.c.y + _loc11_;
            this.m_u1.Set(_loc12_ - _loc4_,_loc13_ - _loc5_);
            this.m_u2.Set(_loc14_ - _loc6_,_loc15_ - _loc7_);
            _loc16_ = this.m_u1.Length();
            _loc17_ = this.m_u2.Length();
            if(_loc16_ > b2Settings.b2_linearSlop)
            {
               this.m_u1.Multiply(1 / _loc16_);
            }
            else
            {
               this.m_u1.SetZero();
            }
            if(_loc17_ > b2Settings.b2_linearSlop)
            {
               this.m_u2.Multiply(1 / _loc17_);
            }
            else
            {
               this.m_u2.SetZero();
            }
            _loc18_ = this.m_constant - _loc16_ - this.m_ratio * _loc17_;
            _loc23_ = b2Math.b2Max(_loc23_,-_loc18_);
            _loc18_ = b2Math.b2Clamp(_loc18_ + b2Settings.b2_linearSlop,-b2Settings.b2_maxLinearCorrection,0);
            _loc19_ = -this.m_pulleyMass * _loc18_;
            _loc20_ = this.m_positionImpulse;
            this.m_positionImpulse = b2Math.b2Max(0,this.m_positionImpulse + _loc19_);
            _loc19_ = this.m_positionImpulse - _loc20_;
            _loc12_ = -_loc19_ * this.m_u1.x;
            _loc13_ = -_loc19_ * this.m_u1.y;
            _loc14_ = -this.m_ratio * _loc19_ * this.m_u2.x;
            _loc15_ = -this.m_ratio * _loc19_ * this.m_u2.y;
            _loc1_.m_sweep.c.x += _loc1_.m_invMass * _loc12_;
            _loc1_.m_sweep.c.y += _loc1_.m_invMass * _loc13_;
            _loc1_.m_sweep.a += _loc1_.m_invI * (_loc8_ * _loc13_ - _loc9_ * _loc12_);
            _loc2_.m_sweep.c.x += _loc2_.m_invMass * _loc14_;
            _loc2_.m_sweep.c.y += _loc2_.m_invMass * _loc15_;
            _loc2_.m_sweep.a += _loc2_.m_invI * (_loc10_ * _loc15_ - _loc11_ * _loc14_);
            _loc1_.SynchronizeTransform();
            _loc2_.SynchronizeTransform();
         }
         if(this.m_limitState1 == b2Joint.e_atUpperLimit)
         {
            _loc3_ = _loc1_.m_xf.R;
            _loc8_ = this.m_localAnchor1.x - _loc1_.m_sweep.localCenter.x;
            _loc9_ = this.m_localAnchor1.y - _loc1_.m_sweep.localCenter.y;
            _loc22_ = _loc3_.col1.x * _loc8_ + _loc3_.col2.x * _loc9_;
            _loc9_ = _loc3_.col1.y * _loc8_ + _loc3_.col2.y * _loc9_;
            _loc8_ = _loc22_;
            _loc12_ = _loc1_.m_sweep.c.x + _loc8_;
            _loc13_ = _loc1_.m_sweep.c.y + _loc9_;
            this.m_u1.Set(_loc12_ - _loc4_,_loc13_ - _loc5_);
            _loc16_ = this.m_u1.Length();
            if(_loc16_ > b2Settings.b2_linearSlop)
            {
               this.m_u1.x *= 1 / _loc16_;
               this.m_u1.y *= 1 / _loc16_;
            }
            else
            {
               this.m_u1.SetZero();
            }
            _loc18_ = this.m_maxLength1 - _loc16_;
            _loc23_ = b2Math.b2Max(_loc23_,-_loc18_);
            _loc18_ = b2Math.b2Clamp(_loc18_ + b2Settings.b2_linearSlop,-b2Settings.b2_maxLinearCorrection,0);
            _loc19_ = -this.m_limitMass1 * _loc18_;
            _loc21_ = this.m_limitPositionImpulse1;
            this.m_limitPositionImpulse1 = b2Math.b2Max(0,this.m_limitPositionImpulse1 + _loc19_);
            _loc19_ = this.m_limitPositionImpulse1 - _loc21_;
            _loc12_ = -_loc19_ * this.m_u1.x;
            _loc13_ = -_loc19_ * this.m_u1.y;
            _loc1_.m_sweep.c.x += _loc1_.m_invMass * _loc12_;
            _loc1_.m_sweep.c.y += _loc1_.m_invMass * _loc13_;
            _loc1_.m_sweep.a += _loc1_.m_invI * (_loc8_ * _loc13_ - _loc9_ * _loc12_);
            _loc1_.SynchronizeTransform();
         }
         if(this.m_limitState2 == b2Joint.e_atUpperLimit)
         {
            _loc3_ = _loc2_.m_xf.R;
            _loc10_ = this.m_localAnchor2.x - _loc2_.m_sweep.localCenter.x;
            _loc11_ = this.m_localAnchor2.y - _loc2_.m_sweep.localCenter.y;
            _loc22_ = _loc3_.col1.x * _loc10_ + _loc3_.col2.x * _loc11_;
            _loc11_ = _loc3_.col1.y * _loc10_ + _loc3_.col2.y * _loc11_;
            _loc10_ = _loc22_;
            _loc14_ = _loc2_.m_sweep.c.x + _loc10_;
            _loc15_ = _loc2_.m_sweep.c.y + _loc11_;
            this.m_u2.Set(_loc14_ - _loc6_,_loc15_ - _loc7_);
            _loc17_ = this.m_u2.Length();
            if(_loc17_ > b2Settings.b2_linearSlop)
            {
               this.m_u2.x *= 1 / _loc17_;
               this.m_u2.y *= 1 / _loc17_;
            }
            else
            {
               this.m_u2.SetZero();
            }
            _loc18_ = this.m_maxLength2 - _loc17_;
            _loc23_ = b2Math.b2Max(_loc23_,-_loc18_);
            _loc18_ = b2Math.b2Clamp(_loc18_ + b2Settings.b2_linearSlop,-b2Settings.b2_maxLinearCorrection,0);
            _loc19_ = -this.m_limitMass2 * _loc18_;
            _loc21_ = this.m_limitPositionImpulse2;
            this.m_limitPositionImpulse2 = b2Math.b2Max(0,this.m_limitPositionImpulse2 + _loc19_);
            _loc19_ = this.m_limitPositionImpulse2 - _loc21_;
            _loc14_ = -_loc19_ * this.m_u2.x;
            _loc15_ = -_loc19_ * this.m_u2.y;
            _loc2_.m_sweep.c.x += _loc2_.m_invMass * _loc14_;
            _loc2_.m_sweep.c.y += _loc2_.m_invMass * _loc15_;
            _loc2_.m_sweep.a += _loc2_.m_invI * (_loc10_ * _loc15_ - _loc11_ * _loc14_);
            _loc2_.SynchronizeTransform();
         }
         return _loc23_ < b2Settings.b2_linearSlop;
      
}
InitVelocityConstraints(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         var _loc22_ = NaN;
         var _loc23_ = NaN;
         var _loc24_ = NaN;
         var _loc25_ = NaN;
         var _loc26_ = NaN;
         _loc2_ = this.m_body1;
         _loc3_ = this.m_body2;
         _loc4_ = _loc2_.m_xf.R;
         _loc5_ = this.m_localAnchor1.x - _loc2_.m_sweep.localCenter.x;
         _loc6_ = this.m_localAnchor1.y - _loc2_.m_sweep.localCenter.y;
         _loc7_ = _loc4_.col1.x * _loc5_ + _loc4_.col2.x * _loc6_;
         _loc6_ = _loc4_.col1.y * _loc5_ + _loc4_.col2.y * _loc6_;
         _loc5_ = _loc7_;
         _loc4_ = _loc3_.m_xf.R;
         _loc8_ = this.m_localAnchor2.x - _loc3_.m_sweep.localCenter.x;
         _loc9_ = this.m_localAnchor2.y - _loc3_.m_sweep.localCenter.y;
         _loc7_ = _loc4_.col1.x * _loc8_ + _loc4_.col2.x * _loc9_;
         _loc9_ = _loc4_.col1.y * _loc8_ + _loc4_.col2.y * _loc9_;
         _loc8_ = _loc7_;
         _loc10_ = _loc2_.m_sweep.c.x + _loc5_;
         _loc11_ = _loc2_.m_sweep.c.y + _loc6_;
         _loc12_ = _loc3_.m_sweep.c.x + _loc8_;
         _loc13_ = _loc3_.m_sweep.c.y + _loc9_;
         _loc14_ = this.m_ground.m_xf.position.x + this.m_groundAnchor1.x;
         _loc15_ = this.m_ground.m_xf.position.y + this.m_groundAnchor1.y;
         _loc16_ = this.m_ground.m_xf.position.x + this.m_groundAnchor2.x;
         _loc17_ = this.m_ground.m_xf.position.y + this.m_groundAnchor2.y;
         this.m_u1.Set(_loc10_ - _loc14_,_loc11_ - _loc15_);
         this.m_u2.Set(_loc12_ - _loc16_,_loc13_ - _loc17_);
         _loc18_ = this.m_u1.Length();
         _loc19_ = this.m_u2.Length();
         if(_loc18_ > b2Settings.b2_linearSlop)
         {
            this.m_u1.Multiply(1 / _loc18_);
         }
         else
         {
            this.m_u1.SetZero();
         }
         if(_loc19_ > b2Settings.b2_linearSlop)
         {
            this.m_u2.Multiply(1 / _loc19_);
         }
         else
         {
            this.m_u2.SetZero();
         }
         _loc20_ = this.m_constant - _loc18_ - this.m_ratio * _loc19_;
         if(_loc20_ > 0)
         {
            this.m_state = int(b2Joint.e_inactiveLimit);
            this.m_force = 0;
         }
         else
         {
            this.m_state = int(b2Joint.e_atUpperLimit);
            this.m_positionImpulse = 0;
         }
         if(_loc18_ < this.m_maxLength1)
         {
            this.m_limitState1 = int(b2Joint.e_inactiveLimit);
            this.m_limitForce1 = 0;
         }
         else
         {
            this.m_limitState1 = int(b2Joint.e_atUpperLimit);
            this.m_limitPositionImpulse1 = 0;
         }
         if(_loc19_ < this.m_maxLength2)
         {
            this.m_limitState2 = int(b2Joint.e_inactiveLimit);
            this.m_limitForce2 = 0;
         }
         else
         {
            this.m_limitState2 = int(b2Joint.e_atUpperLimit);
            this.m_limitPositionImpulse2 = 0;
         }
         _loc21_ = _loc5_ * this.m_u1.y - _loc6_ * this.m_u1.x;
         _loc22_ = _loc8_ * this.m_u2.y - _loc9_ * this.m_u2.x;
         this.m_limitMass1 = _loc2_.m_invMass + _loc2_.m_invI * _loc21_ * _loc21_;
         this.m_limitMass2 = _loc3_.m_invMass + _loc3_.m_invI * _loc22_ * _loc22_;
         this.m_pulleyMass = this.m_limitMass1 + this.m_ratio * this.m_ratio * this.m_limitMass2;
         this.m_limitMass1 = 1 / this.m_limitMass1;
         this.m_limitMass2 = 1 / this.m_limitMass2;
         this.m_pulleyMass = 1 / this.m_pulleyMass;
         if(param1.warmStarting)
         {
            _loc23_ = param1.dt * (-this.m_force - this.m_limitForce1) * this.m_u1.x;
            _loc24_ = param1.dt * (-this.m_force - this.m_limitForce1) * this.m_u1.y;
            _loc25_ = param1.dt * (-this.m_ratio * this.m_force - this.m_limitForce2) * this.m_u2.x;
            _loc26_ = param1.dt * (-this.m_ratio * this.m_force - this.m_limitForce2) * this.m_u2.y;
            _loc2_.m_linearVelocity.x += _loc2_.m_invMass * _loc23_;
            _loc2_.m_linearVelocity.y += _loc2_.m_invMass * _loc24_;
            _loc2_.m_angularVelocity += _loc2_.m_invI * (_loc5_ * _loc24_ - _loc6_ * _loc23_);
            _loc3_.m_linearVelocity.x += _loc3_.m_invMass * _loc25_;
            _loc3_.m_linearVelocity.y += _loc3_.m_invMass * _loc26_;
            _loc3_.m_angularVelocity += _loc3_.m_invI * (_loc8_ * _loc26_ - _loc9_ * _loc25_);
         }
         else
         {
            this.m_force = 0;
            this.m_limitForce1 = 0;
            this.m_limitForce2 = 0;
         }
      
}
GetReactionTorque() {
         return 0;
      
}
GetRatio() {
         return this.m_ratio;
      
}
GetLength2() {
         var _loc1_ = null;
         var _loc2_ = NaN;
         var _loc3_ = NaN;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         _loc1_ = this.m_body2.GetWorldPoint(this.m_localAnchor2);
         _loc2_ = this.m_ground.m_xf.position.x + this.m_groundAnchor2.x;
         _loc3_ = this.m_ground.m_xf.position.y + this.m_groundAnchor2.y;
         _loc4_ = _loc1_.x - _loc2_;
         _loc5_ = _loc1_.y - _loc3_;
         return Math.sqrt(_loc4_ * _loc4_ + _loc5_ * _loc5_);
      
}
SolveVelocityConstraints(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         _loc2_ = this.m_body1;
         _loc3_ = this.m_body2;
         _loc4_ = _loc2_.m_xf.R;
         _loc5_ = this.m_localAnchor1.x - _loc2_.m_sweep.localCenter.x;
         _loc6_ = this.m_localAnchor1.y - _loc2_.m_sweep.localCenter.y;
         _loc7_ = _loc4_.col1.x * _loc5_ + _loc4_.col2.x * _loc6_;
         _loc6_ = _loc4_.col1.y * _loc5_ + _loc4_.col2.y * _loc6_;
         _loc5_ = _loc7_;
         _loc4_ = _loc3_.m_xf.R;
         _loc8_ = this.m_localAnchor2.x - _loc3_.m_sweep.localCenter.x;
         _loc9_ = this.m_localAnchor2.y - _loc3_.m_sweep.localCenter.y;
         _loc7_ = _loc4_.col1.x * _loc8_ + _loc4_.col2.x * _loc9_;
         _loc9_ = _loc4_.col1.y * _loc8_ + _loc4_.col2.y * _loc9_;
         _loc8_ = _loc7_;
         if(this.m_state == b2Joint.e_atUpperLimit)
         {
            _loc10_ = _loc2_.m_linearVelocity.x + -_loc2_.m_angularVelocity * _loc6_;
            _loc11_ = _loc2_.m_linearVelocity.y + _loc2_.m_angularVelocity * _loc5_;
            _loc12_ = _loc3_.m_linearVelocity.x + -_loc3_.m_angularVelocity * _loc9_;
            _loc13_ = _loc3_.m_linearVelocity.y + _loc3_.m_angularVelocity * _loc8_;
            _loc18_ = -(this.m_u1.x * _loc10_ + this.m_u1.y * _loc11_) - this.m_ratio * (this.m_u2.x * _loc12_ + this.m_u2.y * _loc13_);
            _loc19_ = -param1.inv_dt * this.m_pulleyMass * _loc18_;
            _loc20_ = this.m_force;
            this.m_force = b2Math.b2Max(0,this.m_force + _loc19_);
            _loc19_ = this.m_force - _loc20_;
            _loc14_ = -param1.dt * _loc19_ * this.m_u1.x;
            _loc15_ = -param1.dt * _loc19_ * this.m_u1.y;
            _loc16_ = -param1.dt * this.m_ratio * _loc19_ * this.m_u2.x;
            _loc17_ = -param1.dt * this.m_ratio * _loc19_ * this.m_u2.y;
            _loc2_.m_linearVelocity.x += _loc2_.m_invMass * _loc14_;
            _loc2_.m_linearVelocity.y += _loc2_.m_invMass * _loc15_;
            _loc2_.m_angularVelocity += _loc2_.m_invI * (_loc5_ * _loc15_ - _loc6_ * _loc14_);
            _loc3_.m_linearVelocity.x += _loc3_.m_invMass * _loc16_;
            _loc3_.m_linearVelocity.y += _loc3_.m_invMass * _loc17_;
            _loc3_.m_angularVelocity += _loc3_.m_invI * (_loc8_ * _loc17_ - _loc9_ * _loc16_);
         }
         if(this.m_limitState1 == b2Joint.e_atUpperLimit)
         {
            _loc10_ = _loc2_.m_linearVelocity.x + -_loc2_.m_angularVelocity * _loc6_;
            _loc11_ = _loc2_.m_linearVelocity.y + _loc2_.m_angularVelocity * _loc5_;
            _loc18_ = -(this.m_u1.x * _loc10_ + this.m_u1.y * _loc11_);
            _loc19_ = -param1.inv_dt * this.m_limitMass1 * _loc18_;
            _loc20_ = this.m_limitForce1;
            this.m_limitForce1 = b2Math.b2Max(0,this.m_limitForce1 + _loc19_);
            _loc19_ = this.m_limitForce1 - _loc20_;
            _loc14_ = -param1.dt * _loc19_ * this.m_u1.x;
            _loc15_ = -param1.dt * _loc19_ * this.m_u1.y;
            _loc2_.m_linearVelocity.x += _loc2_.m_invMass * _loc14_;
            _loc2_.m_linearVelocity.y += _loc2_.m_invMass * _loc15_;
            _loc2_.m_angularVelocity += _loc2_.m_invI * (_loc5_ * _loc15_ - _loc6_ * _loc14_);
         }
         if(this.m_limitState2 == b2Joint.e_atUpperLimit)
         {
            _loc12_ = _loc3_.m_linearVelocity.x + -_loc3_.m_angularVelocity * _loc9_;
            _loc13_ = _loc3_.m_linearVelocity.y + _loc3_.m_angularVelocity * _loc8_;
            _loc18_ = -(this.m_u2.x * _loc12_ + this.m_u2.y * _loc13_);
            _loc19_ = -param1.inv_dt * this.m_limitMass2 * _loc18_;
            _loc20_ = this.m_limitForce2;
            this.m_limitForce2 = b2Math.b2Max(0,this.m_limitForce2 + _loc19_);
            _loc19_ = this.m_limitForce2 - _loc20_;
            _loc16_ = -param1.dt * _loc19_ * this.m_u2.x;
            _loc17_ = -param1.dt * _loc19_ * this.m_u2.y;
            _loc3_.m_linearVelocity.x += _loc3_.m_invMass * _loc16_;
            _loc3_.m_linearVelocity.y += _loc3_.m_invMass * _loc17_;
            _loc3_.m_angularVelocity += _loc3_.m_invI * (_loc8_ * _loc17_ - _loc9_ * _loc16_);
         }
      
}
GetLength1() {
         var _loc1_ = null;
         var _loc2_ = NaN;
         var _loc3_ = NaN;
         var _loc4_ = NaN;
         var _loc5_ = NaN;
         _loc1_ = this.m_body1.GetWorldPoint(this.m_localAnchor1);
         _loc2_ = this.m_ground.m_xf.position.x + this.m_groundAnchor1.x;
         _loc3_ = this.m_ground.m_xf.position.y + this.m_groundAnchor1.y;
         _loc4_ = _loc1_.x - _loc2_;
         _loc5_ = _loc1_.y - _loc3_;
         return Math.sqrt(_loc4_ * _loc4_ + _loc5_ * _loc5_);
      
}
GetGroundAnchor1() {
         var _loc1_ = null;
         _loc1_ = this.m_ground.m_xf.position.Copy();
         _loc1_.Add(this.m_groundAnchor1);
         return _loc1_;
      
}
}
class b2PulleyJointDef extends b2JointDef {
maxLength2 = NaN;
length1 = NaN;
length2 = NaN;
maxLength1 = NaN;
ratio = NaN;
groundAnchor1 = new b2Vec2();
groundAnchor2 = new b2Vec2();
localAnchor1 = new b2Vec2();
localAnchor2 = new b2Vec2();
constructor() {
         super();
         this.type = b2Joint.e_pulleyJoint;
         this.groundAnchor1.Set(-1,1);
         this.groundAnchor2.Set(1,1);
         this.localAnchor1.Set(-1,0);
         this.localAnchor2.Set(1,0);
         this.length1 = 0;
         this.maxLength1 = 0;
         this.length2 = 0;
         this.maxLength2 = 0;
         this.ratio = 1;
         this.collideConnected = true;
      
}
Initialize(param1, param2, param3, param4, param5, param6, param7) {
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         this.body1 = param1;
         this.body2 = param2;
         this.groundAnchor1.SetV(param3);
         this.groundAnchor2.SetV(param4);
         this.localAnchor1 = this.body1.GetLocalPoint(param5);
         this.localAnchor2 = this.body2.GetLocalPoint(param6);
         _loc8_ = param5.x - param3.x;
         _loc9_ = param5.y - param3.y;
         this.length1 = Math.sqrt(_loc8_ * _loc8_ + _loc9_ * _loc9_);
         _loc10_ = param6.x - param4.x;
         _loc11_ = param6.y - param4.y;
         this.length2 = Math.sqrt(_loc10_ * _loc10_ + _loc11_ * _loc11_);
         this.ratio = param7;
         _loc12_ = this.length1 + this.ratio * this.length2;
         this.maxLength1 = _loc12_ - this.ratio * b2PulleyJoint.b2_minPulleyLength;
         this.maxLength2 = (_loc12_ - b2PulleyJoint.b2_minPulleyLength) / this.ratio;
      
}
}
class b2RevoluteJoint extends b2Joint {
static tImpulse;
m_limitForce = NaN;
m_motorForce = NaN;
m_pivotMass = new b2Mat22();
m_enableLimit = false;
m_limitState = 0;
m_motorMass = NaN;
m_localAnchor1 = new b2Vec2();
m_localAnchor2 = new b2Vec2();
K1 = new b2Mat22();
K2 = new b2Mat22();
K3 = new b2Mat22();
K = new b2Mat22();
m_pivotForce = new b2Vec2();
m_motorSpeed = NaN;
m_enableMotor = false;
m_limitPositionImpulse = NaN;
m_maxMotorTorque = NaN;
m_referenceAngle = NaN;
m_lowerAngle = NaN;
m_upperAngle = NaN;
constructor(param1) {
         super(param1);
         this.m_localAnchor1.SetV(param1.localAnchor1);
         this.m_localAnchor2.SetV(param1.localAnchor2);
         this.m_referenceAngle = param1.referenceAngle;
         this.m_pivotForce.Set(0,0);
         this.m_motorForce = 0;
         this.m_limitForce = 0;
         this.m_limitPositionImpulse = 0;
         this.m_lowerAngle = param1.lowerAngle;
         this.m_upperAngle = param1.upperAngle;
         this.m_maxMotorTorque = param1.maxMotorTorque;
         this.m_motorSpeed = param1.motorSpeed;
         this.m_enableLimit = param1.enableLimit;
         this.m_enableMotor = param1.enableMotor;
      
}
GetAnchor1() {
         return this.m_body1.GetWorldPoint(this.m_localAnchor1);
      
}
GetAnchor2() {
         return this.m_body2.GetWorldPoint(this.m_localAnchor2);
      
}
EnableMotor(param1) {
         this.m_enableMotor = param1;
      
}
GetUpperLimit() {
         return this.m_upperAngle;
      
}
GetLowerLimit() {
         return this.m_lowerAngle;
      
}
SetLimits(param1, param2) {
         this.m_lowerAngle = param1;
         this.m_upperAngle = param2;
      
}
GetMotorSpeed() {
         return this.m_motorSpeed;
      
}
GetReactionForce() {
         return this.m_pivotForce;
      
}
SolvePositionConstraints() {
         var _loc1_ = NaN;
         var _loc2_ = NaN;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = NaN;
         var _loc6_ = null;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         var _loc22_ = NaN;
         var _loc23_ = NaN;
         var _loc24_ = NaN;
         var _loc25_ = NaN;
         var _loc26_ = NaN;
         _loc3_ = this.m_body1;
         _loc4_ = this.m_body2;
         _loc5_ = 0;
         _loc6_ = _loc3_.m_xf.R;
         _loc7_ = this.m_localAnchor1.x - _loc3_.m_sweep.localCenter.x;
         _loc8_ = this.m_localAnchor1.y - _loc3_.m_sweep.localCenter.y;
         _loc9_ = _loc6_.col1.x * _loc7_ + _loc6_.col2.x * _loc8_;
         _loc8_ = _loc6_.col1.y * _loc7_ + _loc6_.col2.y * _loc8_;
         _loc7_ = _loc9_;
         _loc6_ = _loc4_.m_xf.R;
         _loc10_ = this.m_localAnchor2.x - _loc4_.m_sweep.localCenter.x;
         _loc11_ = this.m_localAnchor2.y - _loc4_.m_sweep.localCenter.y;
         _loc9_ = _loc6_.col1.x * _loc10_ + _loc6_.col2.x * _loc11_;
         _loc11_ = _loc6_.col1.y * _loc10_ + _loc6_.col2.y * _loc11_;
         _loc10_ = _loc9_;
         _loc12_ = _loc3_.m_sweep.c.x + _loc7_;
         _loc13_ = _loc3_.m_sweep.c.y + _loc8_;
         _loc14_ = _loc4_.m_sweep.c.x + _loc10_;
         _loc15_ = _loc4_.m_sweep.c.y + _loc11_;
         _loc16_ = _loc14_ - _loc12_;
         _loc17_ = _loc15_ - _loc13_;
         _loc5_ = Math.sqrt(_loc16_ * _loc16_ + _loc17_ * _loc17_);
         _loc18_ = _loc3_.m_invMass;
         _loc19_ = _loc4_.m_invMass;
         _loc20_ = _loc3_.m_invI;
         _loc21_ = _loc4_.m_invI;
         this.K1.col1.x = _loc18_ + _loc19_;
         this.K1.col2.x = 0;
         this.K1.col1.y = 0;
         this.K1.col2.y = _loc18_ + _loc19_;
         this.K2.col1.x = _loc20_ * _loc8_ * _loc8_;
         this.K2.col2.x = -_loc20_ * _loc7_ * _loc8_;
         this.K2.col1.y = -_loc20_ * _loc7_ * _loc8_;
         this.K2.col2.y = _loc20_ * _loc7_ * _loc7_;
         this.K3.col1.x = _loc21_ * _loc11_ * _loc11_;
         this.K3.col2.x = -_loc21_ * _loc10_ * _loc11_;
         this.K3.col1.y = -_loc21_ * _loc10_ * _loc11_;
         this.K3.col2.y = _loc21_ * _loc10_ * _loc10_;
         this.K.SetM(this.K1);
         this.K.AddM(this.K2);
         this.K.AddM(this.K3);
         this.K.Solve(b2RevoluteJoint.tImpulse,-_loc16_,-_loc17_);
         _loc22_ = b2RevoluteJoint.tImpulse.x;
         _loc23_ = b2RevoluteJoint.tImpulse.y;
         _loc3_.m_sweep.c.x -= _loc3_.m_invMass * _loc22_;
         _loc3_.m_sweep.c.y -= _loc3_.m_invMass * _loc23_;
         _loc3_.m_sweep.a -= _loc3_.m_invI * (_loc7_ * _loc23_ - _loc8_ * _loc22_);
         _loc4_.m_sweep.c.x += _loc4_.m_invMass * _loc22_;
         _loc4_.m_sweep.c.y += _loc4_.m_invMass * _loc23_;
         _loc4_.m_sweep.a += _loc4_.m_invI * (_loc10_ * _loc23_ - _loc11_ * _loc22_);
         _loc3_.SynchronizeTransform();
         _loc4_.SynchronizeTransform();
         _loc24_ = 0;
         if(this.m_enableLimit && this.m_limitState != b2Joint.e_inactiveLimit)
         {
            _loc25_ = _loc4_.m_sweep.a - _loc3_.m_sweep.a - this.m_referenceAngle;
            _loc26_ = 0;
            if(this.m_limitState == b2Joint.e_equalLimits)
            {
               _loc2_ = b2Math.b2Clamp(_loc25_,-b2Settings.b2_maxAngularCorrection,b2Settings.b2_maxAngularCorrection);
               _loc26_ = -this.m_motorMass * _loc2_;
               _loc24_ = b2Math.b2Abs(_loc2_);
            }
            else if(this.m_limitState == b2Joint.e_atLowerLimit)
            {
               _loc2_ = _loc25_ - this.m_lowerAngle;
               _loc24_ = b2Math.b2Max(0,-_loc2_);
               _loc2_ = b2Math.b2Clamp(_loc2_ + b2Settings.b2_angularSlop,-b2Settings.b2_maxAngularCorrection,0);
               _loc26_ = -this.m_motorMass * _loc2_;
               _loc1_ = this.m_limitPositionImpulse;
               this.m_limitPositionImpulse = b2Math.b2Max(this.m_limitPositionImpulse + _loc26_,0);
               _loc26_ = this.m_limitPositionImpulse - _loc1_;
            }
            else if(this.m_limitState == b2Joint.e_atUpperLimit)
            {
               _loc2_ = _loc25_ - this.m_upperAngle;
               _loc24_ = b2Math.b2Max(0,_loc2_);
               _loc2_ = b2Math.b2Clamp(_loc2_ - b2Settings.b2_angularSlop,0,b2Settings.b2_maxAngularCorrection);
               _loc26_ = -this.m_motorMass * _loc2_;
               _loc1_ = this.m_limitPositionImpulse;
               this.m_limitPositionImpulse = b2Math.b2Min(this.m_limitPositionImpulse + _loc26_,0);
               _loc26_ = this.m_limitPositionImpulse - _loc1_;
            }
            _loc3_.m_sweep.a -= _loc3_.m_invI * _loc26_;
            _loc4_.m_sweep.a += _loc4_.m_invI * _loc26_;
            _loc3_.SynchronizeTransform();
            _loc4_.SynchronizeTransform();
         }
         return _loc5_ <= b2Settings.b2_linearSlop && _loc24_ <= b2Settings.b2_angularSlop;
      
}
GetJointSpeed() {
         return this.m_body2.m_angularVelocity - this.m_body1.m_angularVelocity;
      
}
SetMotorSpeed(param1) {
         this.m_motorSpeed = param1;
      
}
SetMaxMotorTorque(param1) {
         this.m_maxMotorTorque = param1;
      
}
GetJointAngle() {
         return this.m_body2.m_sweep.a - this.m_body1.m_sweep.a - this.m_referenceAngle;
      
}
InitVelocityConstraints(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         _loc2_ = this.m_body1;
         _loc3_ = this.m_body2;
         _loc4_ = _loc2_.m_xf.R;
         _loc6_ = this.m_localAnchor1.x - _loc2_.m_sweep.localCenter.x;
         _loc7_ = this.m_localAnchor1.y - _loc2_.m_sweep.localCenter.y;
         _loc5_ = _loc4_.col1.x * _loc6_ + _loc4_.col2.x * _loc7_;
         _loc7_ = _loc4_.col1.y * _loc6_ + _loc4_.col2.y * _loc7_;
         _loc6_ = _loc5_;
         _loc4_ = _loc3_.m_xf.R;
         _loc8_ = this.m_localAnchor2.x - _loc3_.m_sweep.localCenter.x;
         _loc9_ = this.m_localAnchor2.y - _loc3_.m_sweep.localCenter.y;
         _loc5_ = _loc4_.col1.x * _loc8_ + _loc4_.col2.x * _loc9_;
         _loc9_ = _loc4_.col1.y * _loc8_ + _loc4_.col2.y * _loc9_;
         _loc8_ = _loc5_;
         _loc10_ = _loc2_.m_invMass;
         _loc11_ = _loc3_.m_invMass;
         _loc12_ = _loc2_.m_invI;
         _loc13_ = _loc3_.m_invI;
         this.K1.col1.x = _loc10_ + _loc11_;
         this.K1.col2.x = 0;
         this.K1.col1.y = 0;
         this.K1.col2.y = _loc10_ + _loc11_;
         this.K2.col1.x = _loc12_ * _loc7_ * _loc7_;
         this.K2.col2.x = -_loc12_ * _loc6_ * _loc7_;
         this.K2.col1.y = -_loc12_ * _loc6_ * _loc7_;
         this.K2.col2.y = _loc12_ * _loc6_ * _loc6_;
         this.K3.col1.x = _loc13_ * _loc9_ * _loc9_;
         this.K3.col2.x = -_loc13_ * _loc8_ * _loc9_;
         this.K3.col1.y = -_loc13_ * _loc8_ * _loc9_;
         this.K3.col2.y = _loc13_ * _loc8_ * _loc8_;
         this.K.SetM(this.K1);
         this.K.AddM(this.K2);
         this.K.AddM(this.K3);
         this.K.Invert(this.m_pivotMass);
         this.m_motorMass = 1 / (_loc12_ + _loc13_);
         if(this.m_enableMotor == false)
         {
            this.m_motorForce = 0;
         }
         if(this.m_enableLimit)
         {
            _loc14_ = _loc3_.m_sweep.a - _loc2_.m_sweep.a - this.m_referenceAngle;
            if(b2Math.b2Abs(this.m_upperAngle - this.m_lowerAngle) < 2 * b2Settings.b2_angularSlop)
            {
               this.m_limitState = int(b2Joint.e_equalLimits);
            }
            else if(_loc14_ <= this.m_lowerAngle)
            {
               if(this.m_limitState != b2Joint.e_atLowerLimit)
               {
                  this.m_limitForce = 0;
               }
               this.m_limitState = int(b2Joint.e_atLowerLimit);
            }
            else if(_loc14_ >= this.m_upperAngle)
            {
               if(this.m_limitState != b2Joint.e_atUpperLimit)
               {
                  this.m_limitForce = 0;
               }
               this.m_limitState = int(b2Joint.e_atUpperLimit);
            }
            else
            {
               this.m_limitState = int(b2Joint.e_inactiveLimit);
               this.m_limitForce = 0;
            }
         }
         else
         {
            this.m_limitForce = 0;
         }
         if(param1.warmStarting)
         {
            _loc2_.m_linearVelocity.x -= param1.dt * _loc10_ * this.m_pivotForce.x;
            _loc2_.m_linearVelocity.y -= param1.dt * _loc10_ * this.m_pivotForce.y;
            _loc2_.m_angularVelocity -= param1.dt * _loc12_ * (_loc6_ * this.m_pivotForce.y - _loc7_ * this.m_pivotForce.x + this.m_motorForce + this.m_limitForce);
            _loc3_.m_linearVelocity.x += param1.dt * _loc11_ * this.m_pivotForce.x;
            _loc3_.m_linearVelocity.y += param1.dt * _loc11_ * this.m_pivotForce.y;
            _loc3_.m_angularVelocity += param1.dt * _loc13_ * (_loc8_ * this.m_pivotForce.y - _loc9_ * this.m_pivotForce.x + this.m_motorForce + this.m_limitForce);
         }
         else
         {
            this.m_pivotForce.SetZero();
            this.m_motorForce = 0;
            this.m_limitForce = 0;
         }
         this.m_limitPositionImpulse = 0;
      
}
EnableLimit(param1) {
         this.m_enableLimit = param1;
      
}
GetMotorTorque() {
         return this.m_motorForce;
      
}
GetReactionTorque() {
         return this.m_limitForce;
      
}
IsLimitEnabled() {
         return this.m_enableLimit;
      
}
IsMotorEnabled() {
         return this.m_enableMotor;
      
}
SolveVelocityConstraints(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = NaN;
         var _loc6_ = NaN;
         var _loc7_ = NaN;
         var _loc8_ = NaN;
         var _loc9_ = NaN;
         var _loc10_ = NaN;
         var _loc11_ = NaN;
         var _loc12_ = NaN;
         var _loc13_ = NaN;
         var _loc14_ = NaN;
         var _loc15_ = NaN;
         var _loc16_ = NaN;
         var _loc17_ = NaN;
         var _loc18_ = NaN;
         var _loc19_ = NaN;
         var _loc20_ = NaN;
         var _loc21_ = NaN;
         _loc2_ = this.m_body1;
         _loc3_ = this.m_body2;
         _loc4_ = _loc2_.m_xf.R;
         _loc6_ = this.m_localAnchor1.x - _loc2_.m_sweep.localCenter.x;
         _loc7_ = this.m_localAnchor1.y - _loc2_.m_sweep.localCenter.y;
         _loc5_ = _loc4_.col1.x * _loc6_ + _loc4_.col2.x * _loc7_;
         _loc7_ = _loc4_.col1.y * _loc6_ + _loc4_.col2.y * _loc7_;
         _loc6_ = _loc5_;
         _loc4_ = _loc3_.m_xf.R;
         _loc8_ = this.m_localAnchor2.x - _loc3_.m_sweep.localCenter.x;
         _loc9_ = this.m_localAnchor2.y - _loc3_.m_sweep.localCenter.y;
         _loc5_ = _loc4_.col1.x * _loc8_ + _loc4_.col2.x * _loc9_;
         _loc9_ = _loc4_.col1.y * _loc8_ + _loc4_.col2.y * _loc9_;
         _loc8_ = _loc5_;
         _loc11_ = _loc3_.m_linearVelocity.x + -_loc3_.m_angularVelocity * _loc9_ - _loc2_.m_linearVelocity.x - -_loc2_.m_angularVelocity * _loc7_;
         _loc12_ = _loc3_.m_linearVelocity.y + _loc3_.m_angularVelocity * _loc8_ - _loc2_.m_linearVelocity.y - _loc2_.m_angularVelocity * _loc6_;
         _loc13_ = -param1.inv_dt * (this.m_pivotMass.col1.x * _loc11_ + this.m_pivotMass.col2.x * _loc12_);
         _loc14_ = -param1.inv_dt * (this.m_pivotMass.col1.y * _loc11_ + this.m_pivotMass.col2.y * _loc12_);
         this.m_pivotForce.x += _loc13_;
         this.m_pivotForce.y += _loc14_;
         _loc15_ = param1.dt * _loc13_;
         _loc16_ = param1.dt * _loc14_;
         _loc2_.m_linearVelocity.x -= _loc2_.m_invMass * _loc15_;
         _loc2_.m_linearVelocity.y -= _loc2_.m_invMass * _loc16_;
         _loc2_.m_angularVelocity -= _loc2_.m_invI * (_loc6_ * _loc16_ - _loc7_ * _loc15_);
         _loc3_.m_linearVelocity.x += _loc3_.m_invMass * _loc15_;
         _loc3_.m_linearVelocity.y += _loc3_.m_invMass * _loc16_;
         _loc3_.m_angularVelocity += _loc3_.m_invI * (_loc8_ * _loc16_ - _loc9_ * _loc15_);
         if(this.m_enableMotor && this.m_limitState != b2Joint.e_equalLimits)
         {
            _loc17_ = _loc3_.m_angularVelocity - _loc2_.m_angularVelocity - this.m_motorSpeed;
            _loc18_ = -param1.inv_dt * this.m_motorMass * _loc17_;
            _loc19_ = this.m_motorForce;
            this.m_motorForce = b2Math.b2Clamp(this.m_motorForce + _loc18_,-this.m_maxMotorTorque,this.m_maxMotorTorque);
            _loc18_ = this.m_motorForce - _loc19_;
            _loc2_.m_angularVelocity -= _loc2_.m_invI * param1.dt * _loc18_;
            _loc3_.m_angularVelocity += _loc3_.m_invI * param1.dt * _loc18_;
         }
         if(this.m_enableLimit && this.m_limitState != b2Joint.e_inactiveLimit)
         {
            _loc20_ = _loc3_.m_angularVelocity - _loc2_.m_angularVelocity;
            _loc21_ = -param1.inv_dt * this.m_motorMass * _loc20_;
            if(this.m_limitState == b2Joint.e_equalLimits)
            {
               this.m_limitForce += _loc21_;
            }
            else if(this.m_limitState == b2Joint.e_atLowerLimit)
            {
               _loc10_ = this.m_limitForce;
               this.m_limitForce = b2Math.b2Max(this.m_limitForce + _loc21_,0);
               _loc21_ = this.m_limitForce - _loc10_;
            }
            else if(this.m_limitState == b2Joint.e_atUpperLimit)
            {
               _loc10_ = this.m_limitForce;
               this.m_limitForce = b2Math.b2Min(this.m_limitForce + _loc21_,0);
               _loc21_ = this.m_limitForce - _loc10_;
            }
            _loc2_.m_angularVelocity -= _loc2_.m_invI * param1.dt * _loc21_;
            _loc3_.m_angularVelocity += _loc3_.m_invI * param1.dt * _loc21_;
         }
      
}
}
class b2RevoluteJointDef extends b2JointDef {
referenceAngle = NaN;
upperAngle = NaN;
lowerAngle = NaN;
motorSpeed = NaN;
maxMotorTorque = NaN;
localAnchor1 = new b2Vec2();
localAnchor2 = new b2Vec2();
enableLimit = false;
enableMotor = false;
constructor() {
         super();
         this.type = b2Joint.e_revoluteJoint;
         this.localAnchor1.Set(0,0);
         this.localAnchor2.Set(0,0);
         this.referenceAngle = 0;
         this.lowerAngle = 0;
         this.upperAngle = 0;
         this.maxMotorTorque = 0;
         this.motorSpeed = 0;
         this.enableLimit = false;
         this.enableMotor = false;
      
}
Initialize(param1, param2, param3) {
         this.body1 = param1;
         this.body2 = param2;
         this.localAnchor1 = this.body1.GetLocalPoint(param3);
         this.localAnchor2 = this.body2.GetLocalPoint(param3);
         this.referenceAngle = this.body2.GetAngle() - this.body1.GetAngle();
      
}
}
class b2ContactManager extends b2PairCallback {
static s_evalCP;
m_world = null;
m_destroyImmediate = false;
m_nullContact = new b2NullContact();
constructor() {
         super();
         this.m_world = null;
         this.m_destroyImmediate = false;
      
}
PairAdded(param1, param2) {
         var _loc3_ = null;
         var _loc4_ = null;
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = null;
         _loc3_ = param1;
         _loc4_ = param2;
         _loc5_ = _loc3_.m_body;
         _loc6_ = _loc4_.m_body;
         if(_loc5_.IsStatic() && _loc6_.IsStatic())
         {
            return this.m_nullContact;
         }
         if(_loc3_.m_body == _loc4_.m_body)
         {
            return this.m_nullContact;
         }
         if(_loc6_.IsConnected(_loc5_))
         {
            return this.m_nullContact;
         }
         if(this.m_world.m_contactFilter != null && this.m_world.m_contactFilter.ShouldCollide(_loc3_,_loc4_) == false)
         {
            return this.m_nullContact;
         }
         _loc7_ = b2Contact.Create(_loc3_,_loc4_,this.m_world.m_blockAllocator);
         if(_loc7_ == null)
         {
            return this.m_nullContact;
         }
         _loc3_ = _loc7_.m_shape1;
         _loc4_ = _loc7_.m_shape2;
         _loc5_ = _loc3_.m_body;
         _loc6_ = _loc4_.m_body;
         _loc7_.m_prev = null;
         _loc7_.m_next = this.m_world.m_contactList;
         if(this.m_world.m_contactList != null)
         {
            this.m_world.m_contactList.m_prev = _loc7_;
         }
         this.m_world.m_contactList = _loc7_;
         _loc7_.m_node1.contact = _loc7_;
         _loc7_.m_node1.other = _loc6_;
         _loc7_.m_node1.prev = null;
         _loc7_.m_node1.next = _loc5_.m_contactList;
         if(_loc5_.m_contactList != null)
         {
            _loc5_.m_contactList.prev = _loc7_.m_node1;
         }
         _loc5_.m_contactList = _loc7_.m_node1;
         _loc7_.m_node2.contact = _loc7_;
         _loc7_.m_node2.other = _loc5_;
         _loc7_.m_node2.prev = null;
         _loc7_.m_node2.next = _loc6_.m_contactList;
         if(_loc6_.m_contactList != null)
         {
            _loc6_.m_contactList.prev = _loc7_.m_node2;
         }
         _loc6_.m_contactList = _loc7_.m_node2;
         ++this.m_world.m_contactCount;
         return _loc7_;
      
}
PairRemoved(param1, param2, param3) {
         var _loc4_ = null;
         if(param3 == null)
         {
            return;
         }
         _loc4_ = param3;
         if(_loc4_ == this.m_nullContact)
         {
            return;
         }
         this.Destroy(_loc4_);
      
}
Destroy(param1) {
         var _loc2_ = null;
         var _loc3_ = null;
         var _loc4_ = 0;
         var _loc5_ = null;
         var _loc6_ = null;
         var _loc7_ = null;
         var _loc8_ = null;
         var _loc9_ = null;
         var _loc10_ = null;
         var _loc11_ = 0;
         var _loc12_ = null;
         var _loc13_ = 0;
         var _loc14_ = null;
         var _loc15_ = null;
         var _loc16_ = null;
         _loc2_ = param1.m_shape1;
         _loc3_ = param1.m_shape2;
         _loc4_ = int(param1.m_manifoldCount);
         if(_loc4_ > 0 && Boolean(this.m_world.m_contactListener))
         {
            _loc7_ = _loc2_.m_body;
            _loc8_ = _loc3_.m_body;
            _loc9_ = param1.GetManifolds();
            _loc10_ = b2ContactManager.s_evalCP;
            _loc10_.shape1 = param1.m_shape1;
            _loc10_.shape2 = param1.m_shape2;
            _loc10_.friction = param1.m_friction;
            _loc10_.restitution = param1.m_restitution;
            _loc11_ = int(0);
            while(_loc11_ < _loc4_)
            {
               _loc12_ = _loc9_[_loc11_];
               _loc10_.normal.SetV(_loc12_.normal);
               _loc13_ = int(0);
               while(_loc13_ < _loc12_.pointCount)
               {
                  _loc14_ = _loc12_.points[_loc13_];
                  _loc10_.position = _loc7_.GetWorldPoint(_loc14_.localPoint1);
                  _loc15_ = _loc7_.GetLinearVelocityFromLocalPoint(_loc14_.localPoint1);
                  _loc16_ = _loc8_.GetLinearVelocityFromLocalPoint(_loc14_.localPoint2);
                  _loc10_.velocity.Set(_loc16_.x - _loc15_.x,_loc16_.y - _loc15_.y);
                  _loc10_.separation = _loc14_.separation;
                  _loc10_.id.key = _loc14_.id._key;
                  this.m_world.m_contactListener.Remove(_loc10_);
                  _loc13_++;
               }
               _loc11_++;
            }
         }
         if(param1.m_prev)
         {
            param1.m_prev.m_next = param1.m_next;
         }
         if(param1.m_next)
         {
            param1.m_next.m_prev = param1.m_prev;
         }
         if(param1 == this.m_world.m_contactList)
         {
            this.m_world.m_contactList = param1.m_next;
         }
         _loc5_ = _loc2_.m_body;
         _loc6_ = _loc3_.m_body;
         if(param1.m_node1.prev)
         {
            param1.m_node1.prev.next = param1.m_node1.next;
         }
         if(param1.m_node1.next)
         {
            param1.m_node1.next.prev = param1.m_node1.prev;
         }
         if(param1.m_node1 == _loc5_.m_contactList)
         {
            _loc5_.m_contactList = param1.m_node1.next;
         }
         if(param1.m_node2.prev)
         {
            param1.m_node2.prev.next = param1.m_node2.next;
         }
         if(param1.m_node2.next)
         {
            param1.m_node2.next.prev = param1.m_node2.prev;
         }
         if(param1.m_node2 == _loc6_.m_contactList)
         {
            _loc6_.m_contactList = param1.m_node2.next;
         }
         b2Contact.Destroy(param1,this.m_world.m_blockAllocator);
         --this.m_world.m_contactCount;
      
}
Collide() {
         var _loc1_ = null;
         var _loc2_ = null;
         var _loc3_ = null;
         _loc1_ = this.m_world.m_contactList;
         while(_loc1_)
         {
            _loc2_ = _loc1_.m_shape1.m_body;
            _loc3_ = _loc1_.m_shape2.m_body;
            if(!(_loc2_.IsSleeping() && _loc3_.IsSleeping()))
            {
               _loc1_.Update(this.m_world.m_contactListener);
            }
            _loc1_ = _loc1_.m_next;
         }
      
}
}
b2Shape.s_proxyAABB = new b2AABB();
b2Shape.s_syncAABB = new b2AABB();
b2Shape.s_resetAABB = new b2AABB();
b2Shape.e_unknownShape = -1;
b2Shape.e_circleShape = 0;
b2Shape.e_polygonShape = 1;
b2Shape.e_shapeTypeCount = 2;
b2BroadPhase.s_validate = false;
b2Collision.b2_nullFeature = 255;
b2Collision.b2CollidePolyTempVec = new b2Vec2();
b2Distance.s_p1s = [new b2Vec2(),new b2Vec2(),new b2Vec2()];
b2Distance.s_p2s = [new b2Vec2(),new b2Vec2(),new b2Vec2()];
b2Distance.s_points = [new b2Vec2(),new b2Vec2(),new b2Vec2()];
b2Distance.gPoint = new b2Point();
b2Distance.g_GJK_Iterations = 0;
b2Pair.e_pairBuffered = 1;
b2Pair.e_pairRemoved = 2;
b2Pair.e_pairFinal = 4;
b2TimeOfImpact.s_p1 = new b2Vec2();
b2TimeOfImpact.s_p2 = new b2Vec2();
b2TimeOfImpact.s_xf1 = new b2XForm();
b2TimeOfImpact.s_xf2 = new b2XForm();
b2Math.b2Vec2_zero = new b2Vec2(0,0);
b2Math.b2Mat22_identity = new b2Mat22(0,new b2Vec2(1,0),new b2Vec2(0,1));
b2Settings.USHRT_MAX = 65535;
b2Settings.b2_pi = Math.PI;
b2Settings.b2_maxManifoldPoints = 2;
b2Settings.b2_maxPolygonVertices = 8;
b2Settings.b2_maxProxies = 512;
b2Settings.b2_linearSlop = 0.005;
b2Settings.b2_maxTOIContactsPerIsland = 32;
b2Settings.b2_velocityThreshold = 1;
b2Settings.b2_maxLinearCorrection = 0.2;
b2Settings.b2_maxLinearVelocity = 200;
b2Settings.b2_maxAngularVelocity = 250;
b2Settings.b2_contactBaumgarte = 0.2;
b2Settings.b2_timeToSleep = 0.5;
b2Settings.b2_linearSleepTolerance = 0.01;
b2Settings.b2_angularSleepTolerance = 2 / 180;
b2Contact.s_registers = null;
b2Contact.e_nonSolidFlag = 1;
b2Contact.e_slowFlag = 2;
b2Contact.e_islandFlag = 4;
b2Contact.e_toiFlag = 8;
b2Contact.s_initialized = false;
b2Joint.e_unknownJoint = 0;
b2Joint.e_revoluteJoint = 1;
b2Joint.e_prismaticJoint = 2;
b2Joint.e_distanceJoint = 3;
b2Joint.e_pulleyJoint = 4;
b2Joint.e_mouseJoint = 5;
b2Joint.e_gearJoint = 6;
b2Joint.e_inactiveLimit = 0;
b2Joint.e_atLowerLimit = 1;
b2Joint.e_atUpperLimit = 2;
b2Joint.e_equalLimits = 3;
b2Body.s_massData = new b2MassData();
b2Body.s_xf1 = new b2XForm();
b2Body.e_frozenFlag = 2;
b2Body.e_islandFlag = 4;
b2Body.e_sleepFlag = 8;
b2Body.e_allowSleepFlag = 16;
b2Body.e_bulletFlag = 32;
b2Body.e_fixedRotationFlag = 64;
b2Body.e_staticType = 1;
b2Body.e_dynamicType = 2;
b2Body.e_maxTypes = 3;
b2ContactFilter.b2_defaultFilter = new b2ContactFilter();
b2DebugDraw.e_shapeBit = 1;
b2DebugDraw.e_jointBit = 2;
b2DebugDraw.e_coreShapeBit = 4;
b2DebugDraw.e_aabbBit = 8;
b2DebugDraw.e_obbBit = 16;
b2DebugDraw.e_pairBit = 32;
b2DebugDraw.e_centerOfMassBit = 64;
b2Island.s_reportCR = new b2ContactResult();
b2World.m_continuousPhysics = false;
b2World.m_warmStarting = false;
b2World.m_positionCorrection = false;
b2World.s_jointColor = new b2Color(0.5,0.8,0.8);
b2World.s_coreColor = new b2Color(0.9,0.6,0.6);
b2World.s_xf = new b2XForm();
b2PolygonDef.s_mat = new b2Mat22();
b2PolygonShape.s_computeMat = new b2Mat22();
b2PolygonShape.s_sweptAABB1 = new b2AABB();
b2PolygonShape.s_sweptAABB2 = new b2AABB();
b2CircleContact.s_evalCP = new b2ContactPoint();
b2PolyAndCircleContact.s_evalCP = new b2ContactPoint();
b2PolygonContact.s_evalCP = new b2ContactPoint();
b2PulleyJoint.b2_minPulleyLength = 2;
b2RevoluteJoint.tImpulse = new b2Vec2();
b2ContactManager.s_evalCP = new b2ContactPoint();
b2BroadPhase.b2_invalid = b2Settings.USHRT_MAX;
b2BroadPhase.b2_nullEdge = b2Settings.USHRT_MAX;
b2Pair.b2_nullPair = b2Settings.USHRT_MAX;
b2Pair.b2_nullProxy = b2Settings.USHRT_MAX;
b2Math.b2XForm_identity = new b2XForm(b2Math.b2Vec2_zero,b2Math.b2Mat22_identity);
b2Settings.b2_maxPairs = 8 * b2Settings.b2_maxProxies;
b2Settings.b2_angularSlop = 2 / 180 * b2Settings.b2_pi;
b2Settings.b2_toiSlop = 8 * b2Settings.b2_linearSlop;
b2Settings.b2_maxAngularCorrection = 8 / 180 * b2Settings.b2_pi;
b2Settings.b2_maxLinearVelocitySquared = b2Settings.b2_maxLinearVelocity * b2Settings.b2_maxLinearVelocity;
b2Settings.b2_maxAngularVelocitySquared = b2Settings.b2_maxAngularVelocity * b2Settings.b2_maxAngularVelocity;
b2Pair.b2_tableCapacity = b2Settings.b2_maxPairs;
b2Pair.b2_tableMask = b2Pair.b2_tableCapacity - 1;
root.RazeLegacyBox2D={ClipVertex,Features,b2CircleDef,b2CircleShape,b2FilterData,b2MassData,b2PolygonDef,b2PolygonShape,b2Shape,b2ShapeDef,b2AABB,b2Bound,b2BoundValues,b2BroadPhase,b2BufferedPair,b2Collision,b2ContactID,b2ContactPoint,b2Distance,b2Manifold,b2ManifoldPoint,b2OBB,b2Pair,b2PairCallback,b2PairManager,b2Point,b2Proxy,b2Segment,b2TimeOfImpact,b2Mat22,b2Math,b2Sweep,b2Vec2,b2XForm,b2Color,b2Settings,b2CircleContact,b2Contact,b2ContactConstraint,b2ContactConstraintPoint,b2ContactEdge,b2ContactRegister,b2ContactResult,b2ContactSolver,b2NullContact,b2PolyAndCircleContact,b2PolygonContact,b2DistanceJoint,b2DistanceJointDef,b2GearJoint,b2GearJointDef,b2Jacobian,b2Joint,b2JointDef,b2JointEdge,b2MouseJoint,b2MouseJointDef,b2PrismaticJoint,b2PrismaticJointDef,b2PulleyJoint,b2PulleyJointDef,b2RevoluteJoint,b2RevoluteJointDef,b2Body,b2BodyDef,b2BoundaryListener,b2ContactFilter,b2ContactListener,b2ContactManager,b2DebugDraw,b2DestructionListener,b2Island,b2TimeStep,b2World};
})(typeof globalThis!=="undefined"?globalThis:this);
