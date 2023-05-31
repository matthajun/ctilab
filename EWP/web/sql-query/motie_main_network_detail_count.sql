select count(*) as detail_cnt
 from
 (
select  distinct f_time, f_ip, f_type, f_single_rule, f_hash
        ,b_time, b_ip, b_type, b_single_rule, b_hash
        ,corr
        ,f_time time , '' ip, null ruleId
        ,assetId ,assetHogiCode, assetHighClassCode, assetClassCode, assetNm, stationId, stationNm, powerGenId , powerGenNm
        ,'상관' as rule_type , '상관' as gubun_t
        ,multiName as ruleName , multiContent as ruleContent
       -- ,version
       , '' hash
    from
        (
          with {assetId}                 as searchAssetId
              ,'P' as detailListSearchGubun

          select f_time, f_ip, f_type, f_single_rule, f_hash
                ,b_time, b_ip, b_type, b_single_rule, b_hash
                ,corr
                ,assetId , assetHogiCode, assetHighClassCode, assetClassCode,assetNm , stationId, stationNm ,powerGenId, powerGenNm
                ,version
            from dti.motie_ai_corr_result_v2 macrv
                ,dti.view_motie_pwer_asset_info asst
            where macrv.ai_label = 'True' and macrv.corr > 0
              and f_time BETWEEN toDateTime('{START_TIME}') and toDateTime('{END_TIME}')
              and macrv.f_ip = asst.assetIp
              and if( detailListSearchGubun = 'P',  asset.powerGenId , asset.stationId )   =  '{powerGenId}'
              and if( searchAssetId > 0 , asst.assetId = searchAssetId , asst.assetId>0)
          union all
          with {assetId}                 as searchAssetId
              ,'P' as detailListSearchGubun

          select f_time, f_ip, f_type, f_single_rule, f_hash
                ,b_time, b_ip, b_type, b_single_rule, b_hash
                ,corr
                ,assetId , assetHogiCode, assetHighClassCode, assetClassCode,assetNm , stationId, stationNm ,powerGenId, powerGenNm
                ,version
            from dti.motie_ai_corr_result_v2 macrv
               ,dti.view_motie_pwer_asset_info asst
            where macrv.ai_label = 'True' and macrv.corr > 0
              and f_time BETWEEN toDateTime('{START_TIME}') and toDateTime('{END_TIME}')
              and macrv.b_ip = asst.assetIp
              and if( detailListSearchGubun = 'P',  asset.powerGenId , asset.stationId )   =  '{powerGenId}'
              and if( searchAssetId > 0 , asst.assetId = searchAssetId , asst.assetId>0)
        )rs2
        ,dti.motie_rule_multi multi
   where rs2.corr = multi.multiId
   union all
    select distinct  null f_time, '' f_ip, '' f_type, null f_single_rule, '' f_hash
          ,null b_time, '' b_ip, '' b_type, null b_single_rule, '' b_hash
          ,null corr
          ,time , ip, ruleId
          ,assetId , assetHogiCode, assetHighClassCode, assetClassCode,assetNm , stationId, stationNm ,powerGenId, powerGenNm
          ,'단일' as rule_type ,  gubun_t
          ,ruleName , ruleContent
        --  ,version
        , '' hash
      from
        (
        with {assetId}                 as searchAssetId
           ,'P' as detailListSearchGubun


        select    time
                , ip
                , ruleId
                , '단일(로그)' as gubun_t
                ,assetId , assetHogiCode, assetHighClassCode, assetClassCode,assetNm , stationId, stationNm ,powerGenId, powerGenNm
                ,version
                ,hash
          from
           (
           select masl.time
                , ip
                , single_rule as  ruleId
                , '단일(로그)' as gubun_t
                ,version
                ,hash
            from dti.motie_ai_single_log     masl
            where masl.time BETWEEN toDateTime('{START_TIME}') and toDateTime('{END_TIME}')
          union all
          select time
                , ip
                , single_rule as  ruleId
                , '단일(이상행위)' as gubun_t
                ,version
                ,hash
            from dti.motie_ai_single_packet masp
            where masp.time BETWEEN toDateTime('{START_TIME}') and toDateTime('{END_TIME}')
            )rs1
            ,dti.view_motie_pwer_asset_info asst
      where rs1.ip = asst.assetIp
        and if( detailListSearchGubun = 'P',  asset.powerGenId , asset.stationId )   =  '{powerGenId}'
        and if( searchAssetId > 0 , asst.assetId = searchAssetId , asst.assetId>0)
        )rs2
        ,dti.motie_rule_single single
   where rs2.ruleId = single.ruleId
)




