select stationId, stationNm, id , name, b.corr_cnt, single_cnt, b.corr_cnt + single_cnt as att_cnt, 0 pre_att_cnt, 0 prev_cnt
from
(
select pwr.stationId, pwr.stationNm, pwr.powerGenId AS  id , pwr.powerGenNm as name, single_cnt, 0 pre_att_cnt, 0 prev_cnt
from
dti.motie_pwr_info pwr
left outer join
(
    select count() single_cnt
     , powerGenId
    from
    (
        select distinct null f_time, '' f_ip, '' f_type, null f_single_rule, '' f_hash
              ,null b_time, '' b_ip, '' b_type, null b_single_rule, '' b_hash
              ,null corr
              ,time , ip, ruleId
              ,stationId, stationNm ,powerGenId, powerGenNm
              ,'단일' as rule_type ,  gubun_t
              ,ruleName , ruleContent
            --  ,version
             , hash
          from
               (
                   select  time , ip, ruleId, gubun_t, stationId, stationNm ,powerGenId, powerGenNm,version , hash
                     from
                     (
                       select masl.time
                            , ip
                            , single_rule as  ruleId
                            , '로그' as gubun_t
                            , id   as plant_id
                            ,version
                            ,hash
                         from dti.motie_ai_single_log     masl
                        where masl.time BETWEEN toDateTime('{START_TIME}') and toDateTime('{END_TIME}')
                      )rs join dti.motie_pwr_info pwr on rs.plant_id = pwr.powerGenId
                    union all
                   select  time , ip, ruleId, gubun_t, stationId, stationNm ,powerGenId, powerGenNm ,version , hash
                     from
                     (
                       select time
                            , ip
                            , single_rule as  ruleId
                            , '이상행위' as gubun_t
                            ,concat(splitByChar('_' , id)[1] , '_' , splitByChar('_' , id)[2])  as keeperKey
                            ,version
                           -- ,  concat(splitByChar('_' , keeper_id)[1] , '_' , splitByChar('_' , keeper_id)[2]) as keeperKey
                            ,hash
                        from dti.motie_ai_single_packet masp
    where masp.time BETWEEN toDateTime('{START_TIME}') and toDateTime('{END_TIME}')
                     )rs join dti.motie_pwr_info pwr on rs.keeperKey = pwr.keeperKey

               )rs2
               ,dti.motie_rule_single single
         where rs2.ruleId = single.ruleId
           and ruleId in (81, 76, 36, 71, 79, 70, 38, 69, 68, 184, 185, 186, 83, 161, 14, 15, 23, 24, 32, 33, 47, 48, 176, 177, 178, 179, 180, 181, 182)
       )
    group by  powerGenId
    )rs on pwr.powerGenId = rs.powerGenId
    where gubun = 'P' and stationId = '{POWER_GEN_PREPIX_LIKE}'
    order by pwr.powerGenId
)a

JOIN

(
select pwr.powerGenId AS  id , corr_cnt
from
dti.motie_pwr_info pwr
left outer join
(
select count() corr_cnt
        , powerGenId
 from
 (
 select distinct f_time, f_ip, f_type, f_single_rule, f_hash
        ,b_time, b_ip, b_type, b_single_rule, b_hash
        ,corr
         ,NULL time , '' ip, null ruleId
        , stationId, stationNm, powerGenId , powerGenNm
        ,'상관' as rule_type , '상관' as gubun_t
        ,multiName as ruleName , multiContent as ruleContent
       -- ,version
       , '' hash
    from
    (
        select  f_time, f_ip, f_type, f_single_rule, f_hash
               ,b_time, b_ip, b_type, b_single_rule, b_hash
               ,corr
               ,stationId, stationNm ,powerGenId,  powerGenNm,version
          from
          (
              select distinct f_time, if(isNull(f_ip ) , '255.255.255.255' , f_ip ) as f_ip , f_type, f_single_rule, f_hash
                    ,b_time, if(isNull(b_ip ) , '255.255.255.255' ,b_ip ) as b_ip , b_type, b_single_rule, b_hash
                    ,corr
                    ,f_id as plant_id
                    ,version
                  --  ,(select powerGendId from dti.motie_pwr_info limit 1 ) as 1
                from dti.motie_ai_corr_result_v2 macrv
                JOIN dti.view_motie_pwer_asset_info asset on macrv.f_ip=asset.assetIp
                    where macrv.ai_label = 'True' and macrv.corr > 0
                    and f_time BETWEEN toDateTime('{START_TIME}') and toDateTime('{END_TIME}')
                    and f_type = 'log'
           )rs
                join dti.motie_pwr_info pwr on rs.plant_id = pwr.powerGenId
        union all
            select  f_time, f_ip, f_type, f_single_rule, f_hash
               ,b_time, b_ip, b_type, b_single_rule, b_hash
               ,corr
               ,stationId, stationNm ,powerGenId,  powerGenNm
               ,version
            from
            (
              select distinct f_time, if(isNull(f_ip ) , '255.255.255.255' , f_ip ) as f_ip , f_type, f_single_rule, f_hash
                    ,b_time, if(isNull(b_ip ) , '255.255.255.255' ,b_ip ) as b_ip , b_type, b_single_rule, b_hash
                    ,corr
                    ,concat(splitByChar('_' , f_id)[1] , '_' , splitByChar('_' , f_id)[2])  as keeperKey
                    ,version
                  -- ,  concat(splitByChar('_' , keeper_id)[1] , '_' , splitByChar('_' , keeper_id)[2]) as keeperKey
                from dti.motie_ai_corr_result_v2 macrv
                    where macrv.ai_label = 'True' and macrv.corr > 0
                    and f_time BETWEEN toDateTime('{START_TIME}') and toDateTime('{END_TIME}')
                    and f_type = 'packet'
            )rs
            join dti.motie_pwr_info pwr on rs.keeperKey = pwr.keeperKey
    )rs2
    ,dti.motie_rule_multi multi
        where rs2.corr = multi.multiId
        and multiName in ( '악성코드/멀웨어 감염 의심' , '비인가 서비스 발생', 'Flooding 의심', 'DDoS 의심')
   )
group by  powerGenId
)rs on pwr.powerGenId = rs.powerGenId
where gubun = 'P' and stationId = '{POWER_GEN_PREPIX_LIKE}'
order by pwr.powerGenId
)b
on a.id = b.id
