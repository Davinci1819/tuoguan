// @ts-ignore;
import React, { useState } from 'react';
// @ts-ignore;
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Label, Textarea, Tabs, TabsContent, TabsList, TabsTrigger, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, Calendar, Progress, useToast } from '@/components/ui';

export default function HomeworkRegister(props) {
  const {
    toast
  } = useToast();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [activeTab, setActiveTab] = useState('manual');
  const [showProgress, setShowProgress] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [registerOcrRaw, setRegisterOcrRaw] = useState('');
  const [aiStructuredData, setAiStructuredData] = useState([]);

  // Tab 1 表单数据
  const [manualFormData, setManualFormData] = useState({
    subject: '',
    work_list: '',
    deadline: new Date(),
    attachments: []
  });

  // 科目选项
  const subjectOptions = [{
    value: '语文',
    label: '语文'
  }, {
    value: '数学',
    label: '数学'
  }, {
    value: '英语',
    label: '英语'
  }, {
    value: 'custom',
    label: '自定义'
  }];

  // 处理图片上传成功
  const handleImageUploadSuccess = async event => {
    try {
      setShowProgress(true);
      setUploadedImageUrl(event.detail.tempFileURL);

      // 模拟OCR识别过程
      setTimeout(() => {
        // 模拟AI识别结果（多科目）
        const mockAiResult = [{
          subject: '数学',
          work_list: '完成练习册第25-28页，重点复习二次函数'
        }, {
          subject: '语文',
          work_list: '背诵《岳阳楼记》全文，完成课后练习题'
        }];
        setAiStructuredData(mockAiResult);
        setShowProgress(false);
      }, 2000);
    } catch (error) {
      toast({
        title: "识别失败",
        description: "图片识别过程中出现错误",
        variant: "destructive"
      });
      setShowProgress(false);
    }
  };

  // 生成今日清单
  const handleGenerateList = async () => {
    try {
      if (activeTab === 'manual') {
        // 手动填写模式
        if (!manualFormData.subject || !manualFormData.work_list) {
          toast({
            title: "信息不完整",
            description: "请填写科目和作业描述",
            variant: "destructive"
          });
          return;
        }
        await props.$w.cloud.callDataSource({
          dataSourceName: 'homework_main',
          method: 'create',
          params: {
            subject: manualFormData.subject,
            work_list: manualFormData.work_list,
            deadline: manualFormData.deadline.getTime(),
            source_media: uploadedImageUrl ? [uploadedImageUrl] : [],
            source_type: '家长上传',
            creator_id: props.$w.auth.currentUser?.userId || ''
          }
        });
      } else {
        // 拍照识别模式
        if (aiStructuredData.length === 0) {
          toast({
            title: "无识别结果",
            description: "请先上传图片进行识别",
            variant: "destructive"
          });
          return;
        }
        for (const homework of aiStructuredData) {
          await props.$w.cloud.callDataSource({
            dataSourceName: 'homework_main',
            method: 'create',
            params: {
              subject: homework.subject,
              work_list: homework.work_list,
              deadline: currentDate.getTime(),
              source_media: uploadedImageUrl ? [uploadedImageUrl] : [],
              source_type: '家长上传',
              creator_id: props.$w.auth.currentUser?.userId || '',
              register_ocr_raw: {
                raw_text: registerOcrRaw
              }
            }
          });
        }
      }
      toast({
        title: "提交成功",
        description: "作业清单已生成"
      });

      // 跳转到作业中心页
      props.$w.utils.redirectTo({
        pageId: 'homework_center',
        params: {}
      });
    } catch (error) {
      toast({
        title: "提交失败",
        description: error.message || "数据提交过程中出现错误",
        variant: "destructive"
      });
    }
  };

  // 更新AI识别结果中的科目
  const updateAiSubject = (index, value) => {
    const newData = [...aiStructuredData];
    newData[index].subject = value;
    setAiStructuredData(newData);
  };

  // 更新AI识别结果中的作业描述
  const updateAiWorkList = (index, value) => {
    const newData = [...aiStructuredData];
    newData[index].work_list = value;
    setAiStructuredData(newData);
  };
  return <div className="flex flex-col min-h-screen bg-gray-50 p-4 space-y-4">
      {/* 顶部区域 */}
      <div className="flex flex-col space-y-3">
        <h1 className="text-xl font-bold text-gray-900">作业登记</h1>
        <div className="flex items-center space-x-2">
          <Label htmlFor="date-picker">选择日期：</Label>
          <Input id="date-picker" type="date" value={currentDate.toISOString().split('T')[0]} onChange={e => setCurrentDate(new Date(e.target.value))} className="flex-1" />
        </div>
      </div>

      {/* 中部区域 - 选项卡 */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="manual">手动填写</TabsTrigger>
          <TabsTrigger value="photo">拍照识别</TabsTrigger>
        </TabsList>

        {/* Tab 1: 手动填写 */}
        <TabsContent value="manual" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>填写作业信息</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">科目</Label>
                <Select value={manualFormData.subject} onValueChange={value => setManualFormData({
                ...manualFormData,
                subject: value
              })}>
                  <SelectTrigger>
                    <SelectValue placeholder="选择科目" />
                  </SelectTrigger>
                  <SelectContent>
                    {subjectOptions.map(option => <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="work-list">作业描述</Label>
                <Textarea id="work-list" placeholder="请输入作业的具体内容..." value={manualFormData.work_list} onChange={e => setManualFormData({
                ...manualFormData,
                work_list: e.target.value
              })} rows={4} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="deadline">截止时间</Label>
                <Input id="deadline" type="datetime-local" value={manualFormData.deadline.toISOString().slice(0, 16)} onChange={e => setManualFormData({
                ...manualFormData,
                deadline: new Date(e.target.value)
              })} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="attachments">附件上传</Label>
                <Input id="attachments" type="file" multiple onChange={e => {
                const files = Array.from(e.target.files);
                setManualFormData({
                  ...manualFormData,
                  attachments: files
                });
              }} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: 拍照识别 */}
        <TabsContent value="photo" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>拍照识别作业</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>拍黑板照片</Label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <Input type="file" accept="image/*" capture="camera" onChange={handleImageUploadSuccess} className="hidden" id="camera-upload" />
                  <Label htmlFor="camera-upload" className="cursor-pointer">
                    <div className="text-gray-500">
                      <div className="text-2xl">📷</div>
                      <div>点击拍照或选择图片</div>
                    </div>
                  </Label>
                </div>
              </div>

              {showProgress && <div className="space-y-2">
                  <Label>识别进度</Label>
                  <Progress value={50} className="w-full" />
                  <div className="text-sm text-gray-500 text-center">AI识别智能切分中...</div>
                </div>}

              {/* 循环容器 - 多科目回显 */}
              {aiStructuredData.length > 0 && <div className="space-y-4">
                  <Label>识别结果（请核对）</Label>
                  {aiStructuredData.map((item, index) => <Card key={index} className="p-4">
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor={`subject-${index}`}>科目</Label>
                          <Select value={item.subject} onValueChange={value => updateAiSubject(index, value)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {subjectOptions.map(option => <SelectItem key={option.value} value={option.value}>
                                  {option.label}
                                </SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor={`work-list-${index}`}>作业清单</Label>
                          <Textarea id={`work-list-${index}`} value={item.work_list} onChange={e => updateAiWorkList(index, e.target.value)} rows={3} />
                        </div>
                      </div>
                    </Card>)}
                </div>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 底部区域 - 吸底按钮 */}
      <div className="sticky bottom-4">
        <Button onClick={handleGenerateList} className="w-full py-3 text-lg" size="lg">
          生成今日清单
        </Button>
      </div>
    </div>;
}