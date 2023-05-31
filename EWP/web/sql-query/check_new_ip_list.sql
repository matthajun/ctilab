SELECT distinct
       keeperKey
      ,powerGenId
      ,unitId
      ,makeId
      ,plant_name
      ,deviceId
      ,t1.assetIp
      ,deviceMac
  FROM
(
select distinct
       keeper_id  as keeperkey
     -- ,''         as powergenid
      ,unit_id    as unitid
      ,make_id    as makeid
     -- ,''         as plant_name
     -- ,''         as deviceid
      ,device_ip   as assetip
      ,device_mac  as devicemac
  from dti.kdn_amly_H010_device_list t1
 where not exists (
                    select 1 from dti.motie_asset_ip t2
                    where t2.assetip = t1.device_ip
                    and  t2.unitId = t1.unit_id
                    )
   and device_ip is not null AND device_ip > ''
)t1
left outer join
(
 select distinct
      -- ''           as keeperkey
      plant_id     as powergenid
      -- ,''           as unitid
      -- ,''           as makeid
      ,plant_name
      ,device_id    as deviceid
      ,ip_address   as assetip
      -- ,''           as devicemac
  from dti.kdn_lgsys_L003 t1
 where not exists (select 1 from dti.motie_asset_ip t2 where t2.assetip = t1.ip_address)
   and ip_address is not null   and ip_address > ''
)t2 on  t1.assetip = t2.assetip
UNION ALL
 SELECT distinct
       ''           as keeperKey
      ,plant_id     as powerGenId
      ,''           as unitId
      ,''           as makeId
      ,plant_name
      ,device_id    as deviceId
      ,ip_address   as assetIp
      ,''           as deviceMac
  FROM dti.kdn_lgsys_L003 t1
 WHERE NOT EXISTS (SELECT 1 FROM dti.motie_asset_ip t2 WHERE t2.assetIp = t1.ip_address )
   AND NOT EXISTS (SELECT 1 FROM dti.kdn_amly_H010_device_list t2 WHERE t2.device_ip = t1.ip_address )
    and ip_address is not null   and ip_address > ''
