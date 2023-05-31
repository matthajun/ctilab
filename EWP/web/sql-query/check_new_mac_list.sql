select distinct
		id,
		b.assetIp,
		b.unitId,
    a.device_mac,
    b.deviceMac
from dti.kdn_amly_H010_device_list a
join dti.motie_asset_ip b
on a.unit_id = b.unitId
and a.device_ip = b.assetIp
where  (
b.deviceMac is null
or a.device_mac != b.deviceMac
)
and a.device_mac is not null
and a.date_time > date_format(date_sub(now(), interval 1 day),"%Y%m%d%H%i%s")
